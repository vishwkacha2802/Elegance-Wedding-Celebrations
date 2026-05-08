from bson import ObjectId
from pymongo import ASCENDING, DESCENDING

from controller.account_utils import (
    get_primary_profile_type,
    normalize_email,
    resolve_couple_profile_emails,
    utcnow_iso,
)
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

vendors_collection = db["vendors"]
users_collection = db["users"]
services_collection = db["services"]
ratings_collection = db["ratings"]
user_profiles_collection = db["user_profiles"]

# Keep module-level constants together so related rules stay easy to maintain.

RATING_REVIEW_STATUSES = {"pending", "approved", "rejected"}


# Parse object ID values into the format expected by database queries.

def parse_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


# Build the identifier variants used by downstream queries or response shaping.

def build_identifier_variants(*candidates):
    variants = []
    seen = set()

    def add_variant(value):
        marker = (type(value), value)
        if marker in seen:
            return
        seen.add(marker)
        variants.append(value)

    for candidate in candidates:
        if candidate is None:
            continue

        if isinstance(candidate, str):
            normalized_candidate = candidate.strip()
            if not normalized_candidate:
                continue
            add_variant(normalized_candidate)
            if normalized_candidate.isdigit():
                add_variant(int(normalized_candidate))
            continue

        if isinstance(candidate, int):
            add_variant(candidate)
            add_variant(str(candidate))
            continue

        normalized_candidate = str(candidate).strip()
        if not normalized_candidate:
            continue
        add_variant(normalized_candidate)
        if normalized_candidate.isdigit():
            add_variant(int(normalized_candidate))

    return variants


# Normalize rating value values before comparisons, storage, or responses.

def normalize_rating_value(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return 0

    if parsed < 1 or parsed > 5:
        return 0

    return parsed


# Normalize review status values before comparisons, storage, or responses.

def normalize_rating_review_status(value, default: str = "approved"):
    normalized_value = str(value or "").strip().lower()
    if normalized_value in RATING_REVIEW_STATUSES:
        return normalized_value
    return default


# Build the public review visibility filter used by downstream queries.

def build_public_rating_match(base_query=None):
    public_filter = {
        "$or": [
            {"status": "approved"},
            {"status": {"$exists": False}},
            {"status": ""},
            {"status": None},
        ]
    }

    if not base_query:
        return public_filter

    return {"$and": [base_query, public_filter]}


# Handle the read average rating workflow used by this module.

def _read_average_rating(document):
    try:
        value = float(
            (document or {}).get("average_rating")
            or (document or {}).get("averageRating")
            or (document or {}).get("rating")
            or 0
        )
    except (TypeError, ValueError):
        value = 0.0

    return round(max(value, 0.0), 1)


# Handle the read total reviews workflow used by this module.

def _read_total_reviews(document):
    try:
        value = int(
            (document or {}).get("total_reviews")
            or (document or {}).get("totalReviews")
            or len((document or {}).get("reviews") or [])
            or 0
        )
    except (TypeError, ValueError):
        value = 0

    return max(value, 0)


# Return vendor rating fields for the calling workflow.

def get_vendor_rating_fields(vendor):
    average_rating = _read_average_rating(vendor)
    total_reviews = _read_total_reviews(vendor)
    return {
        "average_rating": average_rating,
        "averageRating": average_rating,
        "total_reviews": total_reviews,
        "totalReviews": total_reviews,
        "rating": average_rating,
    }


# Return service rating fields for the calling workflow.

def get_service_rating_fields(service):
    average_rating = _read_average_rating(service)
    total_reviews = _read_total_reviews(service)
    return {
        "average_rating": average_rating,
        "averageRating": average_rating,
        "total_reviews": total_reviews,
        "totalReviews": total_reviews,
        "rating": average_rating,
    }


# Ensure the required rating indexes exist before these queries run.

async def ensure_rating_indexes():
    index_documents = await ratings_collection.list_indexes().to_list(length=None)
    legacy_index_names = []
    for index_document in index_documents:
        index_name = str(index_document.get("name") or "").strip()
        index_key = index_document.get("key") or {}
        key_items = list(index_key.items()) if hasattr(index_key, "items") else []

        if index_name == "ratings_user_vendor_unique":
            legacy_index_names.append(index_name)
            continue

        if key_items == [("user_id", 1), ("vendor_id", 1)]:
            legacy_index_names.append(index_name)

    for index_name in legacy_index_names:
        await ratings_collection.drop_index(index_name)

    await ratings_collection.create_index(
        [("user_id", ASCENDING), ("service_id", ASCENDING)],
        unique=True,
        name="ratings_user_service_unique",
    )
    await ratings_collection.create_index(
        [("service_id", ASCENDING), ("created_at", DESCENDING)],
        name="ratings_service_created_at",
    )


# Resolve vendor document from the available documents and fallback values.

async def resolve_vendor_document(vendor_reference: str):
    reference = str(vendor_reference or "").strip()
    if not reference:
        return None

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


# Resolve service document from the available documents and fallback values.

async def resolve_service_document(service_reference: str):
    reference = str(service_reference or "").strip()
    if not reference:
        return None

    service_query = {"id": int(reference)} if reference.isdigit() else {"id": reference}
    service = await services_collection.find_one(service_query)
    if not service:
        parsed_service_object_id = parse_object_id(reference)
        if parsed_service_object_id:
            service = await services_collection.find_one({"_id": parsed_service_object_id})
    return service


# Resolve service vendor document from the available documents and fallback values.

async def resolve_service_vendor_document(service):
    if not service:
        return None

    return await resolve_vendor_document(str(service.get("vendorId") or "").strip())


# Return vendor identifier variants for the calling workflow.

async def get_vendor_identifier_variants(vendor):
    if not vendor:
        return [], ""

    vendor_email = normalize_email(vendor.get("email"))
    identifier_candidates = build_identifier_variants(
        vendor.get("id"),
        str(vendor.get("_id")) if vendor.get("_id") is not None else "",
    )

    if vendor_email:
        async for vendor_user in users_collection.find({"email": vendor_email, "role": "vendor"}):
            identifier_candidates.extend(
                build_identifier_variants(
                    vendor_user.get("id"),
                    str(vendor_user.get("_id")) if vendor_user.get("_id") is not None else "",
                )
            )

    return build_identifier_variants(*identifier_candidates), vendor_email


# Return vendor service IDs for the calling workflow.

async def get_vendor_service_ids(vendor):
    if not vendor:
        return []

    vendor_identifiers, _ = await get_vendor_identifier_variants(vendor)
    if not vendor_identifiers:
        return []

    service_ids = []
    seen = set()
    async for service_doc in services_collection.find({"vendorId": {"$in": vendor_identifiers}}):
        service_id = str(service_doc.get("id") or service_doc.get("_id") or "").strip()
        if not service_id or service_id in seen:
            continue
        seen.add(service_id)
        service_ids.append(service_id)

    return service_ids


# Build a readable fallback name from the local part of an email address.

def _local_part_name(email: str):
    local_part = str(email or "").split("@", 1)[0].replace(".", " ").replace("_", " ").strip()
    return " ".join(part.capitalize() for part in local_part.split()) if local_part else ""


# Combine profile name fields into a single display name.

def _profile_full_name(profile):
    if not profile:
        return ""

    first_name = str(profile.get("firstName") or "").strip()
    last_name = str(profile.get("lastName") or "").strip()
    full_name = " ".join(part for part in (first_name, last_name) if part).strip()
    if full_name:
        return full_name

    return _local_part_name(profile.get("email"))


# Build the rating author names used by downstream queries or response shaping.

async def build_rating_author_names(user_id: str):
    normalized_user_id = str(user_id or "").strip()
    user_doc = None
    if normalized_user_id:
        user_query = {"id": int(normalized_user_id)} if normalized_user_id.isdigit() else {"id": normalized_user_id}
        user_doc = await users_collection.find_one(user_query)
        if not user_doc:
            parsed_user_object_id = parse_object_id(normalized_user_id)
            if parsed_user_object_id:
                user_doc = await users_collection.find_one({"_id": parsed_user_object_id})

    account_email = normalize_email((user_doc or {}).get("email"))
    partner_email = normalize_email((user_doc or {}).get("partner_email"))
    primary_profile_type = get_primary_profile_type(user_doc, "bride")
    default_profile_emails = resolve_couple_profile_emails(
        account_email,
        partner_email,
        primary_profile_type,
    )
    stored_name = str((user_doc or {}).get("name") or "").strip()

    bride_profile = None
    groom_profile = None
    if account_email:
        bride_profile = await user_profiles_collection.find_one(
            {"accountEmail": account_email, "profileType": "bride"}
        )
        groom_profile = await user_profiles_collection.find_one(
            {"accountEmail": account_email, "profileType": "groom"}
        )

    bride_name = _profile_full_name(bride_profile) or _local_part_name(default_profile_emails["brideEmail"])
    groom_name = _profile_full_name(groom_profile) or _local_part_name(default_profile_emails["groomEmail"])
    primary_name = (
        bride_name if primary_profile_type == "bride" else groom_name
    ) or stored_name or _local_part_name(account_email)
    partner_name = groom_name if primary_profile_type == "bride" else bride_name

    if primary_name and partner_name and primary_name.lower() != partner_name.lower():
        author = f"{primary_name} & {partner_name}"
    else:
        author = primary_name or partner_name or stored_name or "User"

    return {
        "author": author,
        "userName": author,
        "primaryUserName": primary_name or author,
        "partnerName": partner_name,
    }


# Serialize service rating record into the shape returned by the API.

async def serialize_service_rating_record(rating_doc, current_user_id: str = "", author_names_cache=None):
    if not rating_doc:
        return None

    user_id = str(rating_doc.get("user_id") or "").strip()
    created_at = str(
        rating_doc.get("created_at")
        or rating_doc.get("updated_at")
        or rating_doc.get("createdAt")
        or ""
    ).strip()
    review_text = str(rating_doc.get("review") or rating_doc.get("comment") or "").strip()
    author_names_cache = author_names_cache if author_names_cache is not None else {}
    if user_id in author_names_cache:
        author_names = author_names_cache[user_id]
    else:
        author_names = await build_rating_author_names(user_id)
        author_names_cache[user_id] = author_names
    review_status = normalize_rating_review_status(rating_doc.get("status"), default="approved")

    return {
        "id": str(rating_doc.get("_id") or rating_doc.get("id") or ""),
        "userId": user_id,
        "user_id": user_id,
        "serviceId": str(rating_doc.get("service_id") or ""),
        "service_id": str(rating_doc.get("service_id") or ""),
        "author": author_names["author"],
        "userName": author_names["userName"],
        "primaryUserName": author_names["primaryUserName"],
        "partnerName": author_names["partnerName"],
        "rating": normalize_rating_value(rating_doc.get("rating")),
        "review": review_text,
        "comment": review_text,
        "date": created_at,
        "createdAt": created_at,
        "status": review_status,
        "reviewStatus": review_status,
        "review_status": review_status,
        "isMine": bool(current_user_id and current_user_id == user_id),
    }


# Serialize legacy service reviews into the shape returned by the API.

def serialize_legacy_service_reviews(document):
    serialized_reviews = []
    for index, review in enumerate((document or {}).get("reviews") or []):
        review_text = str(review.get("review") or review.get("comment") or "").strip()
        created_at = str(review.get("createdAt") or review.get("date") or "").strip()
        primary_name = str(review.get("primaryUserName") or review.get("author") or "Client").strip() or "Client"
        partner_name = str(review.get("partnerName") or "").strip()
        author = primary_name
        if partner_name and partner_name.lower() != primary_name.lower():
            author = f"{primary_name} & {partner_name}"

        serialized_reviews.append(
            {
                "id": str(review.get("id") or index + 1),
                "userId": "",
                "user_id": "",
                "serviceId": "",
                "service_id": "",
                "author": author,
                "userName": author,
                "primaryUserName": primary_name,
                "partnerName": partner_name,
                "rating": normalize_rating_value(review.get("rating") or 0),
                "review": review_text,
                "comment": review_text,
                "date": created_at,
                "createdAt": created_at,
                "isMine": False,
            }
        )
    return serialized_reviews


# Handle the fetch service rating reviews workflow used by this module.

async def fetch_service_rating_reviews(service, limit: int = 10, current_user_id: str = ""):
    if not service:
        return []

    service_id = str(service.get("id") or service.get("_id") or "").strip()
    if not service_id:
        return serialize_legacy_service_reviews(service)[:limit] if limit > 0 else []

    reviews = []
    cursor = ratings_collection.find(
        build_public_rating_match({"service_id": service_id}),
        sort=[("created_at", -1), ("_id", -1)],
    )
    if limit > 0:
        cursor = cursor.limit(limit)

    author_names_cache = {}
    async for rating_doc in cursor:
        serialized = await serialize_service_rating_record(
            rating_doc,
            current_user_id=current_user_id,
            author_names_cache=author_names_cache,
        )
        if serialized:
            reviews.append(serialized)

    if reviews:
        return reviews

    legacy_reviews = serialize_legacy_service_reviews(service)
    return legacy_reviews[:limit] if limit > 0 else legacy_reviews


# Handle the fetch vendor rating reviews workflow used by this module.

async def fetch_vendor_rating_reviews(vendor, limit: int = 10, current_user_id: str = ""):
    if not vendor:
        return []

    vendor_service_ids = await get_vendor_service_ids(vendor)
    if not vendor_service_ids:
        return serialize_legacy_service_reviews(vendor)[:limit] if limit > 0 else []

    reviews = []
    cursor = ratings_collection.find(
        build_public_rating_match({"service_id": {"$in": vendor_service_ids}}),
        sort=[("created_at", -1), ("_id", -1)],
    )
    if limit > 0:
        cursor = cursor.limit(limit)

    author_names_cache = {}
    async for rating_doc in cursor:
        serialized = await serialize_service_rating_record(
            rating_doc,
            current_user_id=current_user_id,
            author_names_cache=author_names_cache,
        )
        if serialized:
            reviews.append(serialized)

    return reviews


# Recalculate service rating summary from the latest stored records.

async def recalculate_service_rating_summary(service):
    if not service:
        return {
            "average_rating": 0.0,
            "averageRating": 0.0,
            "total_reviews": 0,
            "totalReviews": 0,
            "rating": 0.0,
        }

    service_id = str(service.get("id") or service.get("_id") or "").strip()
    if not service_id:
        return get_service_rating_fields(service)

    pipeline = [
        {"$match": build_public_rating_match({"service_id": service_id})},
        {
            "$group": {
                "_id": "$service_id",
                "average_rating": {"$avg": "$rating"},
                "total_reviews": {"$sum": 1},
            }
        },
    ]
    results = await ratings_collection.aggregate(pipeline).to_list(length=1)

    if results:
        summary_doc = results[0]
        average_rating = round(float(summary_doc.get("average_rating") or 0), 1)
        total_reviews = int(summary_doc.get("total_reviews") or 0)
    else:
        average_rating = 0.0
        total_reviews = 0

    summary = {
        "average_rating": average_rating,
        "averageRating": average_rating,
        "total_reviews": total_reviews,
        "totalReviews": total_reviews,
        "rating": average_rating,
    }

    await services_collection.update_one(
        {"_id": service.get("_id")},
        {"$set": {**summary, "updatedAt": utcnow_iso()}},
    )
    return summary


# Recalculate vendor rating summary from the latest stored records.

async def recalculate_vendor_rating_summary(vendor):
    if not vendor:
        return {
            "average_rating": 0.0,
            "averageRating": 0.0,
            "total_reviews": 0,
            "totalReviews": 0,
            "rating": 0.0,
        }

    vendor_service_ids = await get_vendor_service_ids(vendor)
    if not vendor_service_ids:
        summary = {
            "average_rating": 0.0,
            "averageRating": 0.0,
            "total_reviews": 0,
            "totalReviews": 0,
            "rating": 0.0,
        }
        await vendors_collection.update_one(
            {"_id": vendor.get("_id")},
            {"$set": {**summary, "updatedAt": utcnow_iso()}},
        )
        return summary

    pipeline = [
        {"$match": build_public_rating_match({"service_id": {"$in": vendor_service_ids}})},
        {
            "$group": {
                "_id": None,
                "average_rating": {"$avg": "$rating"},
                "total_reviews": {"$sum": 1},
            }
        },
    ]
    results = await ratings_collection.aggregate(pipeline).to_list(length=1)

    if results:
        summary_doc = results[0]
        average_rating = round(float(summary_doc.get("average_rating") or 0), 1)
        total_reviews = int(summary_doc.get("total_reviews") or 0)
    else:
        average_rating = 0.0
        total_reviews = 0

    summary = {
        "average_rating": average_rating,
        "averageRating": average_rating,
        "total_reviews": total_reviews,
        "totalReviews": total_reviews,
        "rating": average_rating,
    }

    await vendors_collection.update_one(
        {"_id": vendor.get("_id")},
        {"$set": {**summary, "updatedAt": utcnow_iso()}},
    )
    return summary
