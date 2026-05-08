from copy import deepcopy
from time import monotonic

from bson import ObjectId
from fastapi.responses import JSONResponse

from controller.account_utils import (
    build_service_duplicate_lookup_query,
    normalize_email,
    normalize_phone,
    resolve_user_name_by_email,
    resolve_couple_account_context,
    utcnow_iso,
)
from controller.ratings_utils import (
    fetch_service_rating_reviews,
    fetch_vendor_rating_reviews,
    get_service_rating_fields,
    get_vendor_rating_fields,
    resolve_service_document,
)
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

vendors_collection = db["vendors"]
users_collection = db["users"]
services_collection = db["services"]
vendor_inquiries_collection = db["vendor_inquiries"]
bookings_collection = db["bookings"]

# Keep module-level constants together so related rules stay easy to maintain.

SERVICE_KEYWORDS = {
    "venue": ("venue", "banquet", "hall"),
    "catering": ("catering", "caterer", "food"),
    "photography": ("photography", "photographer"),
    "decoration": ("decoration", "decor"),
    "makeup": ("makeup", "styling", "hair"),
    "music": ("music", "dj", "band"),
    "entry": ("entry", "entry style", "walking on clouds", "piro"),
    "invitation": ("invitation", "invitations", "digital", "physical"),
    "flowers": ("flower", "florist", "floral"),
    "transportation": ("transportation", "transport", "car"),
    "cake": ("cake", "bakery"),
}

SERVICE_BUDGET_WEIGHTS = {
    "venue": 30,
    "catering": 25,
    "photography": 15,
    "decoration": 10,
    "makeup": 5,
    "music": 5,
    "entry": 2,
    "invitation": 1,
    "flowers": 3,
    "transportation": 4,
    "cake": 3,
}

PUBLIC_VENDOR_CACHE_TTL_SECONDS = 45
_public_vendor_cache = {}


# Keep short-lived public search results in memory to absorb repeated filter calls.

def get_cache_key(prefix: str, *parts):
    return "|".join([prefix, *(str(part or "").strip().lower() for part in parts)])


def read_cached_value(cache_key: str):
    cached = _public_vendor_cache.get(cache_key)
    if not cached:
        return None

    expires_at, value = cached
    if monotonic() >= expires_at:
        _public_vendor_cache.pop(cache_key, None)
        return None

    return deepcopy(value)


def write_cached_value(cache_key: str, value):
    _public_vendor_cache[cache_key] = (
        monotonic() + PUBLIC_VENDOR_CACHE_TTL_SECONDS,
        deepcopy(value),
    )


def clear_public_vendor_cache():
    _public_vendor_cache.clear()


# Parse object ID values into the format expected by database queries.

def parse_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


# Expose the normalize text service through the controller layer.

def normalize_text(value: str):
    return " ".join(str(value or "").strip().lower().split())


# Normalize service values before comparisons, storage, or responses.

def normalize_service(value: str):
    normalized = normalize_text(value)
    if not normalized:
        return ""

    for service_id, keywords in SERVICE_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return service_id

    return normalized


# Build the service location used by downstream queries or response shaping.

def build_service_location(service_doc, vendor):
    _ = vendor
    return str((service_doc or {}).get("location") or "").strip()


# Build the location candidates used by downstream queries or response shaping.

def build_location_candidates(service_doc, vendor):
    _ = vendor
    candidates = []
    seen = set()

    for raw_value in (
        (service_doc or {}).get("location"),
    ):
        normalized_value = str(raw_value or "").strip()
        if not normalized_value:
            continue
        normalized_key = normalize_text(normalized_value)
        if not normalized_key or normalized_key in seen:
            continue
        seen.add(normalized_key)
        candidates.append(normalized_value)

    return candidates


# Handle the location matches filter workflow used by this module.

def location_matches_filter(location_filter: str, service_doc, vendor):
    normalized_filter = normalize_text(location_filter)
    if not normalized_filter:
        return True

    for candidate in build_location_candidates(service_doc, vendor):
        normalized_candidate = normalize_text(candidate)
        if not normalized_candidate:
            continue
        if normalized_filter in normalized_candidate or normalized_candidate in normalized_filter:
            return True

    return False


# Calculate location relevance from the booking and pricing inputs.

def calculate_location_relevance(location_filter: str, service_doc, vendor):
    normalized_filter = normalize_text(location_filter)
    if not normalized_filter:
        return 0

    best_score = 0
    for candidate in build_location_candidates(service_doc, vendor):
        normalized_candidate = normalize_text(candidate)
        if not normalized_candidate:
            continue
        if normalized_candidate == normalized_filter:
            best_score = max(best_score, 300)
        elif normalized_candidate.startswith(normalized_filter) or normalized_filter.startswith(normalized_candidate):
            best_score = max(best_score, 200)
        elif normalized_filter in normalized_candidate or normalized_candidate in normalized_filter:
            best_score = max(best_score, 100)

    return best_score


# Build the recommendation sort key used by downstream queries or response shaping.

def build_recommendation_sort_key(item, sort_by: str = "price"):
    price = float(item.get("price") or 0)
    location_relevance = int(item.get("_locationRelevance") or 0)
    service_name = normalize_text(item.get("serviceName") or item.get("businessName") or item.get("service"))
    vendor_name = normalize_text(item.get("vendorName") or item.get("name"))

    if str(sort_by or "").strip().lower() == "relevance":
        return (-location_relevance, price, service_name, vendor_name)

    return (price, -location_relevance, service_name, vendor_name)


# Build the recommendation unique key used by downstream queries or response shaping.

def build_recommendation_unique_key(item):
    service_id = str(item.get("serviceId") or item.get("id") or "").strip()
    vendor_id = str(item.get("vendorId") or "").strip()
    service_name = normalize_text(item.get("serviceName") or item.get("businessName") or item.get("service"))
    price = float(item.get("price") or 0)
    location = normalize_text(item.get("location"))

    if service_id:
        return f"service:{service_id}"

    return f"vendor:{vendor_id}|service:{service_name}|price:{price:.2f}|location:{location}"


# Resolve image URL from the available documents and fallback values.

def resolve_image_url(document):
    if not document:
        return ""

    image_urls = resolve_image_urls(document)
    if image_urls:
        return image_urls[0]

    for key in ("imageUrl", "image_url", "image", "url"):
        candidate = str(document.get(key) or "").strip()
        if candidate:
            return candidate

    return ""


# Resolve image URLs from the available documents and fallback values.

def resolve_image_urls(document):
    if not document:
        return []

    resolved_images = []
    seen = set()

    for key in ("imageUrls", "image_urls", "portfolio"):
        raw_value = document.get(key)
        if not isinstance(raw_value, list):
            continue

        for item in raw_value:
            if isinstance(item, str):
                candidate = item.strip()
            elif isinstance(item, dict):
                candidate = str(
                    item.get("imageUrl") or item.get("image_url") or item.get("image") or item.get("url") or ""
                ).strip()
            else:
                candidate = str(item or "").strip()

            if not candidate or candidate in seen:
                continue
            seen.add(candidate)
            resolved_images.append(candidate)

    for key in ("imageUrl", "image_url", "image", "url"):
        candidate = str(document.get(key) or "").strip()
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        resolved_images.insert(0, candidate)
        break

    return resolved_images


# Normalize non negative int values before comparisons, storage, or responses.

def normalize_non_negative_int(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return 0

    return parsed if parsed > 0 else 0


# Normalize non negative float values before comparisons, storage, or responses.

def normalize_non_negative_float(value):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return 0.0

    return parsed if parsed > 0 else 0.0


# Resolve vendor personal name from the available documents and fallback values.

def resolve_vendor_personal_name(vendor):
    if not vendor:
        return "Vendor"

    return str(
        vendor.get("ownerName")
        or vendor.get("owner_name")
        or vendor.get("name")
        or vendor.get("businessName")
        or "Vendor"
    ).strip() or "Vendor"


# Resolve vendor business name from the available documents and fallback values.

def resolve_vendor_business_name(vendor, service_doc=None):
    return str(
        (service_doc or {}).get("name")
        or (vendor or {}).get("businessName")
        or (vendor or {}).get("name")
        or (service_doc or {}).get("category")
        or (vendor or {}).get("service")
        or (vendor or {}).get("category")
        or resolve_vendor_personal_name(vendor)
        or "Service"
    ).strip() or "Service"


# Resolve vendor booking target from the available documents and fallback values.

async def resolve_vendor_booking_target(vendor_reference: str):
    normalized_reference = str(vendor_reference or "").strip()
    vendor_doc = await resolve_vendor_document(normalized_reference)

    resolved_vendor_id = normalized_reference
    vendor_user_id = ""

    if vendor_doc:
        resolved_vendor_id = str(vendor_doc.get("id") or vendor_doc.get("_id") or normalized_reference)
        vendor_email = normalize_email(vendor_doc.get("email"))
        if vendor_email:
            vendor_user = await users_collection.find_one({"email": vendor_email})
            if vendor_user:
                vendor_user_id = str(vendor_user.get("id") or vendor_user.get("_id") or "")

    booking_vendor_id = vendor_user_id or resolved_vendor_id or normalized_reference
    return booking_vendor_id, resolved_vendor_id, normalized_reference, vendor_doc


# Handle the service matches workflow used by this module.

def service_matches(service_filter: str, vendor_service: str):
    requested_services = [normalize_service(value) for value in str(service_filter or "").split(",") if value.strip()]
    if not requested_services:
        return True

    normalized_vendor_service = normalize_service(vendor_service)
    return normalized_vendor_service in set(requested_services)


# Parse requested services values into the format expected by database queries.

def parse_requested_services(service_filter: str):
    requested_services = []
    seen = set()
    for value in str(service_filter or "").split(","):
        normalized_service = normalize_service(value)
        if not normalized_service or normalized_service in seen:
            continue
        seen.add(normalized_service)
        requested_services.append(normalized_service)

    return requested_services


# Handle the allocate shared budget workflow used by this module.

def allocate_shared_budget(requested_services, total_budget: float):
    normalized_budget = normalize_non_negative_float(total_budget)
    if normalized_budget <= 0 or not requested_services:
        return {}

    weights = [SERVICE_BUDGET_WEIGHTS.get(service_id, 1) for service_id in requested_services]
    total_weight = sum(weight for weight in weights if weight > 0) or len(requested_services)
    allocations = {}
    remaining_budget = round(normalized_budget, 2)

    for index, service_id in enumerate(requested_services):
        if index == len(requested_services) - 1:
            allocated_budget = round(max(remaining_budget, 0.0), 2)
        else:
            service_weight = SERVICE_BUDGET_WEIGHTS.get(service_id, 1)
            allocated_budget = round(normalized_budget * service_weight / total_weight, 2)
            remaining_budget = round(remaining_budget - allocated_budget, 2)

        allocations[service_id] = allocated_budget

    return allocations


# Resolve vendor document from the available documents and fallback values.

async def resolve_vendor_document(vendor_reference: str):
    reference = str(vendor_reference or "").strip()
    if not reference:
        return None

    vendor = None
    vendor_query = {"id": int(reference)} if reference.isdigit() else {"id": reference}
    vendor = await vendors_collection.find_one(vendor_query)
    if not vendor:
        parsed_vendor_object_id = parse_object_id(reference)
        if parsed_vendor_object_id:
            vendor = await vendors_collection.find_one({"_id": parsed_vendor_object_id})

    if vendor:
        return vendor

    user_query = {"id": int(reference)} if reference.isdigit() else {"id": reference}
    user = await users_collection.find_one(user_query)
    if not user:
        parsed_user_object_id = parse_object_id(reference)
        if parsed_user_object_id:
            user = await users_collection.find_one({"_id": parsed_user_object_id})
    if not user:
        return None

    user_email = normalize_email(user.get("email"))
    if not user_email:
        return None

    return await vendors_collection.find_one({"email": user_email})


# Resolve vendor documents once per unique reference instead of once per service.

async def resolve_vendor_documents(vendor_references):
    normalized_references = []
    seen = set()
    for vendor_reference in vendor_references or []:
        normalized_reference = str(vendor_reference or "").strip()
        if not normalized_reference or normalized_reference in seen:
            continue
        seen.add(normalized_reference)
        normalized_references.append(normalized_reference)

    vendor_by_reference = {}
    if not normalized_references:
        return vendor_by_reference

    for normalized_reference in normalized_references:
        vendor_by_reference[normalized_reference] = await resolve_vendor_document(normalized_reference)

    return vendor_by_reference


# Fetch active services once and reuse them for public listing/recommendation flows.

async def fetch_active_service_documents():
    services = []
    async for service_doc in services_collection.find(
        {
            "$or": [
                {"isActive": {"$ne": False}},
                {"isActive": {"$exists": False}},
            ]
        },
        sort=[("createdAt", -1)],
    ):
        services.append(service_doc)

    return services


# Serialize vendor public into the shape returned by the API.

def serialize_vendor_public(vendor):
    if not vendor:
        return None

    rating_fields = get_vendor_rating_fields(vendor)
    vendor_name = resolve_vendor_personal_name(vendor)
    business_name = resolve_vendor_business_name(vendor)

    return {
        "id": str(vendor.get("id") or vendor.get("_id") or ""),
        "serviceId": "",
        "name": vendor_name,
        "vendorName": vendor_name,
        "vendor_name": vendor_name,
        "businessName": business_name,
        "business_name": business_name,
        "service": vendor.get("service") or vendor.get("category") or "",
        "price": float(vendor.get("price") or 0),
        "rating": rating_fields["rating"],
        "average_rating": rating_fields["average_rating"],
        "averageRating": rating_fields["averageRating"],
        "total_reviews": rating_fields["total_reviews"],
        "totalReviews": rating_fields["totalReviews"],
        "location": vendor.get("location") or "",
        "image": resolve_image_url(vendor),
        "description": vendor.get("description") or "",
        "portfolio": vendor.get("portfolio") or [],
        "reviews": vendor.get("reviews") or [],
        "contact": {
            "phone": (vendor.get("contact") or {}).get("phone") or vendor.get("phone") or "",
            "email": (vendor.get("contact") or {}).get("email") or normalize_email(vendor.get("email")),
        },
        "features": vendor.get("features") or [],
        "availability": vendor.get("availability") or "",
    }


# Serialize service public into the shape returned by the API.

def serialize_service_public(service_doc, vendor, reviews):
    service_rating_fields = get_service_rating_fields(service_doc)
    vendor_rating_fields = get_vendor_rating_fields(vendor or {})
    vendor_name = resolve_vendor_personal_name(vendor)
    business_name = resolve_vendor_business_name(vendor, service_doc)

    service_images = resolve_image_urls(service_doc)
    vendor_images = resolve_image_urls(vendor)
    image_url = (service_images[0] if service_images else "") or (vendor_images[0] if vendor_images else "")
    gallery_images = service_images or vendor_images or ([image_url] if image_url else [])
    description = str(
        service_doc.get("description")
        or (vendor or {}).get("description")
        or ""
    ).strip()
    service_id = str(service_doc.get("id") or service_doc.get("_id") or "")
    vendor_id = str((vendor or {}).get("id") or (vendor or {}).get("_id") or service_doc.get("vendorId") or "")

    return {
        "id": service_id,
        "serviceId": service_id,
        "vendorId": vendor_id,
        "name": vendor_name,
        "vendorName": vendor_name,
        "vendor_name": vendor_name,
        "businessName": business_name,
        "business_name": business_name,
        "service": str(service_doc.get("category") or service_doc.get("name") or "").strip(),
        "serviceName": str(service_doc.get("name") or "").strip(),
        "price": float(service_doc.get("price") or 0),
        "rating": service_rating_fields["rating"],
        "average_rating": service_rating_fields["average_rating"],
        "averageRating": service_rating_fields["averageRating"],
        "total_reviews": service_rating_fields["total_reviews"],
        "totalReviews": service_rating_fields["totalReviews"],
        "vendorAverageRating": vendor_rating_fields["averageRating"],
        "vendor_average_rating": vendor_rating_fields["average_rating"],
        "vendorTotalReviews": vendor_rating_fields["totalReviews"],
        "vendor_total_reviews": vendor_rating_fields["total_reviews"],
        "location": build_service_location(service_doc, vendor),
        "image": image_url,
        "description": description,
        "portfolio": gallery_images,
        "reviews": reviews,
        "contact": {
            "phone": ((vendor or {}).get("contact") or {}).get("phone") or (vendor or {}).get("phone") or "",
            "email": ((vendor or {}).get("contact") or {}).get("email") or normalize_email((vendor or {}).get("email")),
        },
        "features": (vendor or {}).get("features") or [],
        "availability": (vendor or {}).get("availability") or "",
    }


# Build the vendor public response used by downstream queries or response shaping.

async def build_vendor_public_response(vendor):
    serialized_vendor = serialize_vendor_public(vendor)
    if not serialized_vendor:
        return None

    serialized_vendor["reviews"] = await fetch_vendor_rating_reviews(vendor, limit=10)
    if not serialized_vendor["totalReviews"]:
        serialized_vendor["totalReviews"] = len(serialized_vendor["reviews"])
        serialized_vendor["total_reviews"] = serialized_vendor["totalReviews"]

    return serialized_vendor


# Handle the service-layer logic for listing vendors.

async def list_vendors_service(service: str, max_price: float, location: str):
    cache_key = get_cache_key("vendors", service, max_price, location)
    cached_response = read_cached_value(cache_key)
    if cached_response is not None:
        return cached_response

    vendors = []
    seen_recommendations = set()
    candidate_services = []
    service_docs = await fetch_active_service_documents()

    for service_doc in service_docs:
        service_value = str(service_doc.get("category") or service_doc.get("name") or "").strip()
        if not service_matches(service, service_value):
            continue

        service_price = float(service_doc.get("price") or 0)
        if max_price and service_price > float(max_price):
            continue

        if not location_matches_filter(location, service_doc, None):
            continue

        candidate_services.append(service_doc)

    vendor_by_reference = await resolve_vendor_documents(
        service_doc.get("vendorId") for service_doc in candidate_services
    )

    for service_doc in candidate_services:
        vendor_reference = str(service_doc.get("vendorId") or "").strip()
        vendor = vendor_by_reference.get(vendor_reference)
        if not location_matches_filter(location, service_doc, vendor):
            continue

        service_reviews = await fetch_service_rating_reviews(service_doc, limit=5)
        serialized_service = serialize_service_public(service_doc, vendor, service_reviews)
        serialized_service["_locationRelevance"] = calculate_location_relevance(location, service_doc, vendor)
        recommendation_key = build_recommendation_unique_key(serialized_service)
        if recommendation_key in seen_recommendations:
            continue
        seen_recommendations.add(recommendation_key)
        vendors.append(serialized_service)

    vendors.sort(key=lambda item: build_recommendation_sort_key(item, "price"))
    for vendor in vendors:
        vendor.pop("_locationRelevance", None)
    write_cached_value(cache_key, vendors)
    return vendors


# Handle the recommend vendors workflow used by this module.

async def recommend_vendors_service(
    service: str,
    budget: float,
    location: str,
    sort_by: str = "price",
):
    requested_services = parse_requested_services(service)
    if not requested_services:
        return JSONResponse({"message": "At least one service is required."}, status_code=400)

    normalized_location = str(location or "").strip()
    if not normalized_location:
        return JSONResponse({"message": "Location is required."}, status_code=400)

    normalized_budget = normalize_non_negative_float(budget)
    if normalized_budget <= 0:
        return JSONResponse({"message": "Budget must be greater than zero."}, status_code=400)

    resolved_sort = "relevance" if str(sort_by or "").strip().lower() == "relevance" else "price"
    allocated_budgets = allocate_shared_budget(requested_services, normalized_budget)
    cache_key = get_cache_key("recommend", ",".join(requested_services), normalized_budget, normalized_location, resolved_sort)
    cached_response = read_cached_value(cache_key)
    if cached_response is not None:
        return cached_response

    requested_service_set = set(requested_services)
    service_docs = await fetch_active_service_documents()
    candidate_services_by_type = {requested_service: [] for requested_service in requested_services}
    for service_doc in service_docs:
        service_value = str(service_doc.get("category") or service_doc.get("name") or "").strip()
        normalized_service_value = normalize_service(service_value)
        if normalized_service_value not in requested_service_set:
            continue

        service_budget = float(allocated_budgets.get(normalized_service_value) or 0)
        service_price = float(service_doc.get("price") or 0)
        if service_budget > 0 and service_price > service_budget:
            continue

        if not location_matches_filter(normalized_location, service_doc, None):
            continue

        candidate_services_by_type[normalized_service_value].append(service_doc)

    vendor_by_reference = await resolve_vendor_documents(
        service_doc.get("vendorId")
        for service_docs_for_type in candidate_services_by_type.values()
        for service_doc in service_docs_for_type
    )
    grouped_recommendations = []
    flattened_recommendations = []
    total_count = 0

    for requested_service in requested_services:
        service_budget = float(allocated_budgets.get(requested_service) or 0)
        service_recommendations = []
        seen_recommendations = set()

        for service_doc in candidate_services_by_type.get(requested_service, []):
            vendor_reference = str(service_doc.get("vendorId") or "").strip()
            vendor = vendor_by_reference.get(vendor_reference)
            if not location_matches_filter(normalized_location, service_doc, vendor):
                continue

            service_reviews = await fetch_service_rating_reviews(service_doc, limit=5)
            serialized_service = serialize_service_public(service_doc, vendor, service_reviews)
            serialized_service["_locationRelevance"] = calculate_location_relevance(
                normalized_location,
                service_doc,
                vendor,
            )
            recommendation_key = build_recommendation_unique_key(serialized_service)
            if recommendation_key in seen_recommendations:
                continue
            seen_recommendations.add(recommendation_key)
            service_recommendations.append(serialized_service)

        service_recommendations.sort(key=lambda item: build_recommendation_sort_key(item, resolved_sort))
        for recommendation in service_recommendations:
            recommendation.pop("_locationRelevance", None)

        cheapest_price = 0.0
        if service_recommendations:
            cheapest_price = float(service_recommendations[0].get("price") or 0)

        grouped_recommendations.append(
            {
                "service": requested_service,
                "allocatedBudget": round(service_budget, 2),
                "allocated_budget": round(service_budget, 2),
                "count": len(service_recommendations),
                "recommendations": service_recommendations,
                "cheapestPrice": round(cheapest_price, 2),
                "cheapest_price": round(cheapest_price, 2),
            }
        )
        flattened_recommendations.extend(service_recommendations)
        total_count += len(service_recommendations)

    matched_service_groups = sum(
        1 for group in grouped_recommendations if group.get("recommendations")
    )
    total_estimated_minimum = round(
        sum(float(group.get("cheapestPrice") or 0) for group in grouped_recommendations if group.get("recommendations")),
        2,
    )
    if total_count == 0:
        response = {
            "success": True,
            "message": f"No vendor services found within your shared budget for {normalized_location}.",
            "count": 0,
            "recommendations": [],
            "groupedRecommendations": grouped_recommendations,
            "grouped_recommendations": grouped_recommendations,
            "selectedServices": requested_services,
            "selected_services": requested_services,
            "totalBudget": normalized_budget,
            "total_budget": normalized_budget,
            "allocationStrategy": "weighted",
            "allocation_strategy": "weighted",
            "matchedServiceCount": 0,
            "matched_service_count": 0,
            "estimatedMinimumTotal": 0,
            "estimated_minimum_total": 0,
            "location": normalized_location,
            "sortBy": resolved_sort,
        }
        write_cached_value(cache_key, response)
        return response

    response = {
        "success": True,
        "message": (
            f"Shared budget allocated across {len(requested_services)} service"
            f"{'' if len(requested_services) == 1 else 's'}."
            f" Found {total_count} matching vendor service"
            f"{'' if total_count == 1 else 's'} in {matched_service_groups} group"
            f"{'' if matched_service_groups == 1 else 's'} for {normalized_location}."
        ),
        "count": total_count,
        "recommendations": flattened_recommendations,
        "groupedRecommendations": grouped_recommendations,
        "grouped_recommendations": grouped_recommendations,
        "selectedServices": requested_services,
        "selected_services": requested_services,
        "totalBudget": normalized_budget,
        "total_budget": normalized_budget,
        "allocationStrategy": "weighted",
        "allocation_strategy": "weighted",
        "matchedServiceCount": matched_service_groups,
        "matched_service_count": matched_service_groups,
        "estimatedMinimumTotal": total_estimated_minimum,
        "estimated_minimum_total": total_estimated_minimum,
        "location": normalized_location,
        "sortBy": resolved_sort,
    }
    write_cached_value(cache_key, response)
    return response


# Handle the service-layer logic for retrieving vendor.

async def get_vendor_service(vendor_id: str):
    service = await resolve_service_document(vendor_id)
    if service:
        vendor = await resolve_vendor_document(str(service.get("vendorId") or "").strip())
        reviews = await fetch_service_rating_reviews(service, limit=10)
        return serialize_service_public(service, vendor, reviews)

    query = {"_id": parse_object_id(vendor_id)} if parse_object_id(vendor_id) else {"id": int(vendor_id) if str(vendor_id).isdigit() else vendor_id}
    vendor = await vendors_collection.find_one(query)
    if not vendor:
        return JSONResponse({"message": "Vendor not found."}, status_code=404)

    return await build_vendor_public_response(vendor)


# Handle the service-layer logic for creating vendor inquiry.

async def create_vendor_inquiry_service(vendor_id: str, payload):
    if not str(payload.name or "").strip() or not normalize_email(payload.email):
        return JSONResponse({"message": "Name and valid email are required."}, status_code=400)

    booking_vendor_id, resolved_vendor_id, vendor_reference, vendor_doc = await resolve_vendor_booking_target(vendor_id)
    selected_service_id = str(getattr(payload, "serviceId", "") or "").strip()
    selected_service_doc = None
    if selected_service_id:
        selected_service_doc = await resolve_service_document(selected_service_id)
    message = str(payload.message or "").strip()
    normalized_email = normalize_email(payload.email)
    normalized_user_email = normalize_email(getattr(payload, "userEmail", "")) or normalized_email
    normalized_phone = normalize_phone(payload.phone)
    guest_count = normalize_non_negative_int(payload.guestCount)
    estimated_budget = normalize_non_negative_float(
        getattr(payload, "allocatedBudget", 0) or payload.budget
    )
    wedding_date = str(payload.weddingDate or "").strip()
    selected_service_type = normalize_service(getattr(payload, "serviceType", ""))
    now = utcnow_iso()

    vendor_location = ""
    if vendor_doc:
        vendor_location = str(vendor_doc.get("location") or "").strip()
    if not vendor_location:
        location_parts = [
            str((vendor_doc or {}).get("city") or "").strip(),
            str((vendor_doc or {}).get("state") or "").strip(),
            str((vendor_doc or {}).get("zipCode") or "").strip(),
        ]
        vendor_location = ", ".join(part for part in location_parts if part)

    requested_location = str(getattr(payload, "location", "") or "").strip() or vendor_location

    service_name = selected_service_type
    if not service_name:
        service_name = str((selected_service_doc or {}).get("name") or (selected_service_doc or {}).get("category") or "").strip()
    if not service_name:
        service_name = str((vendor_doc or {}).get("service") or (vendor_doc or {}).get("category") or "").strip()
    if not service_name and resolved_vendor_id:
        service_doc = await services_collection.find_one(
            {"vendorId": {"$in": [resolved_vendor_id, vendor_reference]}},
            sort=[("createdAt", -1)],
        )
        if service_doc:
            service_name = str(service_doc.get("category") or service_doc.get("name") or "").strip()
            if not selected_service_id:
                selected_service_id = str(service_doc.get("id") or service_doc.get("_id") or "").strip()

    couple_context = await resolve_couple_account_context(normalized_user_email, fallback_name=payload.name)
    account_email = normalize_email(couple_context.get("registeredEmail")) or normalized_user_email
    sender_email = normalize_email(couple_context.get("currentEmail")) or normalized_user_email
    submitted_booker_name = str(payload.name or "").strip()
    booked_by_name = submitted_booker_name or await resolve_user_name_by_email(
        sender_email,
        fallback_name=payload.name,
    )
    stored_partner_email = normalize_email(couple_context.get("partnerEmail"))
    account_user_id = str(couple_context.get("userId") or "").strip()
    account_user_name = str(couple_context.get("userName") or payload.name or "").strip()
    partner_display_email = str(
        couple_context.get("displayPartnerEmail")
        or stored_partner_email
        or account_email
    ).strip()

    duplicate_lookup_query = build_service_duplicate_lookup_query(
        selected_service_id,
        couple_context.get("lookupEmails") or [normalized_user_email],
    )
    if duplicate_lookup_query:
        existing_inquiry = await vendor_inquiries_collection.find_one(duplicate_lookup_query)
        existing_booking = await bookings_collection.find_one(duplicate_lookup_query)
        if existing_inquiry or existing_booking:
            matched_record = existing_inquiry or existing_booking or {}
            matched_partner_email = normalize_email(
                matched_record.get("partner_email") or matched_record.get("partnerEmail")
            ) or partner_display_email
            return JSONResponse(
                {
                    "success": False,
                    "message": f"This service is already booked by your partner ({matched_partner_email})",
                    "partner_email": matched_partner_email,
                },
                status_code=409,
            )

    vendor_name = resolve_vendor_personal_name(vendor_doc)
    business_name = str(
        (selected_service_doc or {}).get("name")
        or (vendor_doc or {}).get("businessName")
        or (vendor_doc or {}).get("name")
        or service_name
        or vendor_name
    ).strip() or "Service"
    service_price = normalize_non_negative_float((selected_service_doc or {}).get("price"))

    inquiry = {
        "vendorId": booking_vendor_id,
        "serviceId": selected_service_id,
        "service_id": selected_service_id,
        "vendorReference": vendor_reference,
        "resolvedVendorId": resolved_vendor_id,
        "vendorName": vendor_name,
        "businessName": business_name,
        "business_name": business_name,
        "name": payload.name,
        "email": normalized_email,
        "userEmail": account_email,
        "registered_email": account_email,
        "registeredEmail": account_email,
        "partner_email": stored_partner_email,
        "partnerEmail": stored_partner_email,
        "booked_by_email": sender_email,
        "bookedByEmail": sender_email,
        "booked_by_name": booked_by_name,
        "bookedByName": booked_by_name,
        "phone": normalized_phone,
        "weddingDate": wedding_date,
        "serviceType": service_name,
        "guestCount": guest_count,
        "budget": estimated_budget,
        "allocatedBudget": estimated_budget,
        "allocated_budget": estimated_budget,
        "location": requested_location,
        "vendorLocation": vendor_location,
        "vendor_location": vendor_location,
        "servicePrice": service_price,
        "service_price": service_price,
        "message": message,
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
    }

    inquiry_result = await vendor_inquiries_collection.insert_one(inquiry)

    booking_request = {
        "vendorId": booking_vendor_id,
        "vendorReference": vendor_reference,
        "resolvedVendorId": resolved_vendor_id,
        "vendorInquiryId": str(inquiry_result.inserted_id),
        "userId": account_user_id,
        "userEmail": account_email,
        "registered_email": account_email,
        "registeredEmail": account_email,
        "partner_email": stored_partner_email,
        "partnerEmail": stored_partner_email,
        "booked_by_email": sender_email,
        "bookedByEmail": sender_email,
        "booked_by_name": booked_by_name,
        "bookedByName": booked_by_name,
        "userName": account_user_name,
        "clientName": payload.name,
        "clientEmail": normalized_email,
        "clientPhone": normalized_phone,
        "serviceId": selected_service_id,
        "service_id": selected_service_id,
        "vendorName": vendor_name,
        "businessName": business_name,
        "business_name": business_name,
        "serviceName": service_name or business_name or "Vendor Inquiry",
        "serviceType": service_name,
        "location": requested_location,
        "vendorLocation": vendor_location,
        "vendor_location": vendor_location,
        "eventDate": wedding_date,
        "eventTime": "",
        "guestCount": guest_count,
        "estimatedBudget": estimated_budget,
        "allocatedBudget": estimated_budget,
        "allocated_budget": estimated_budget,
        "servicePrice": service_price,
        "service_price": service_price,
        "price": service_price,
        "amount": service_price,
        "totalAmount": service_price,
        "notes": message,
        "status": "pending",
        "source": "inquiry_form",
        "createdAt": now,
        "updatedAt": now,
    }
    booking_result = await bookings_collection.insert_one(booking_request)

    return {
        "success": True,
        "message": "Booking request submitted.",
        "inquiryId": str(inquiry_result.inserted_id),
        "bookingId": str(booking_result.inserted_id),
        "booked_by_email": sender_email,
        "booked_by_name": booked_by_name,
        "bookedByEmail": sender_email,
        "bookedByName": booked_by_name,
    }


# Expose the list vendors service through the controller layer.

async def list_vendors(service: str, max_price: float, location: str):
    return await list_vendors_service(service, max_price, location)


# Expose the recommend vendors service through the controller layer.

async def recommend_vendors(service: str, budget: float, location: str, sort_by: str = "price"):
    return await recommend_vendors_service(service, budget, location, sort_by)


# Expose the get vendor service through the controller layer.

async def get_vendor(vendor_id: str):
    return await get_vendor_service(vendor_id)


# Expose the create vendor inquiry service through the controller layer.

async def create_vendor_inquiry(vendor_id: str, payload):
    return await create_vendor_inquiry_service(vendor_id, payload)
