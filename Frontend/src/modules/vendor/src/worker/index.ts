import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

const normalizeText = (value: unknown) => String(value || "").trim();

const normalizeOptionalText = (value: unknown) => {
  const normalizedValue = normalizeText(value);
  return normalizedValue || null;
};

const resolveServiceType = (data: Record<string, unknown>) =>
  normalizeText(data.category || data.serviceType);

const buildServiceName = (name: unknown, serviceType: unknown, location: unknown) => {
  const normalizedName = normalizeText(name);
  if (normalizedName) {
    return normalizedName;
  }

  const normalizedServiceType = normalizeText(serviceType);
  const normalizedLocation = normalizeText(location);
  if (normalizedServiceType && normalizedLocation) {
    return `${normalizedServiceType} - ${normalizedLocation}`;
  }

  return normalizedServiceType || normalizedLocation;
};

const serializeService = (service: Record<string, unknown>) => ({
  id: service.id,
  name: normalizeText(service.name),
  description: normalizeText(service.description),
  price: Number(service.price || 0),
  category: normalizeText(service.category),
  location: normalizeText(service.location),
  imageUrl: normalizeOptionalText(service.image_url || service.imageUrl),
  isActive: Number(service.is_active ?? 1) === 1,
  createdAt: normalizeText(service.created_at || service.createdAt),
});

app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();
  
  const vendor = await c.env.DB.prepare(
    "SELECT id, email, business_name, owner_name FROM vendors WHERE email = ? AND password_hash = ?"
  ).bind(email, password).first();
  
  if (!vendor) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  const token = btoa(JSON.stringify({ id: vendor.id, email: vendor.email, exp: Date.now() + 86400000 }));
  
  return c.json({ 
    token,
    vendor: {
      id: vendor.id,
      email: vendor.email,
      businessName: vendor.business_name,
      ownerName: vendor.owner_name
    }
  });
});

app.get("/api/vendor/profile", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const vendor = await c.env.DB.prepare(
    "SELECT * FROM vendors WHERE id = ?"
  ).bind(vendorId).first();
  
  if (!vendor) return c.json({ error: "Vendor not found" }, 404);
  
  return c.json({
    id: vendor.id,
    email: vendor.email,
    businessName: vendor.business_name,
    ownerName: vendor.owner_name,
    phone: vendor.phone,
    city: vendor.city,
    state: vendor.state,
    zipCode: vendor.zip_code,
    profileImageUrl: vendor.profile_image_url
  });
});

app.put("/api/vendor/profile", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const data = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE vendors SET 
      business_name = ?, owner_name = ?, phone = ?, city = ?, state = ?, zip_code = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    data.businessName, data.ownerName, data.phone, data.city, data.state, data.zipCode, vendorId
  ).run();
  
  return c.json({ success: true });
});

app.get("/api/vendor/stats", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const totalBookings = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE vendor_id = ?"
  ).bind(vendorId).first();
  
  const pendingBookings = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE vendor_id = ? AND status = 'pending'"
  ).bind(vendorId).first();
  
  const approvedBookings = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE vendor_id = ? AND status = 'approved'"
  ).bind(vendorId).first();

  const currentMonthBookings = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE vendor_id = ?
      AND date(created_at) >= date('now', 'start of month')
  `).bind(vendorId).first();

  const lastMonthBookings = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE vendor_id = ?
      AND date(created_at) >= date('now', 'start of month', '-1 month')
      AND date(created_at) < date('now', 'start of month')
  `).bind(vendorId).first();

  const currentMonthApprovedBookings = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE vendor_id = ?
      AND status = 'approved'
      AND date(created_at) >= date('now', 'start of month')
  `).bind(vendorId).first();

  const lastMonthApprovedBookings = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM bookings
    WHERE vendor_id = ?
      AND status = 'approved'
      AND date(created_at) >= date('now', 'start of month', '-1 month')
      AND date(created_at) < date('now', 'start of month')
  `).bind(vendorId).first();
  
  const totalEarnings = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM earnings WHERE vendor_id = ?"
  ).bind(vendorId).first();
  
  const monthlyEarnings = await c.env.DB.prepare(`
    SELECT 
      strftime('%Y-%m', payment_date) as month,
      SUM(amount) as total
    FROM earnings 
    WHERE vendor_id = ? AND payment_date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', payment_date)
    ORDER BY month ASC
  `).bind(vendorId).all();
  
  return c.json({
    totalBookings: totalBookings?.count || 0,
    pendingBookings: pendingBookings?.count || 0,
    approvedBookings: approvedBookings?.count || 0,
    currentMonthBookings: currentMonthBookings?.count || 0,
    lastMonthBookings: lastMonthBookings?.count || 0,
    currentMonthApprovedBookings: currentMonthApprovedBookings?.count || 0,
    lastMonthApprovedBookings: lastMonthApprovedBookings?.count || 0,
    totalEarnings: totalEarnings?.total || 0,
    monthlyEarnings: monthlyEarnings.results || []
  });
});

app.get("/api/services", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const services = await c.env.DB.prepare(
    "SELECT * FROM services WHERE vendor_id = ? ORDER BY created_at DESC"
  ).bind(vendorId).all();
  
  return c.json(services.results.map((service) => serializeService(service as Record<string, unknown>)));
});

app.post("/api/services", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const payload = await c.req.json<Record<string, unknown>>();
  const serviceType = resolveServiceType(payload);
  const location = normalizeText(payload.location);
  const name = buildServiceName(payload.name, serviceType, location);
  const price = Number(payload.price || 0);

  if (!serviceType) {
    return c.json({ error: "Service type is required." }, 400);
  }
  if (!location) {
    return c.json({ error: "Service location is required." }, 400);
  }
  if (!(price > 0)) {
    return c.json({ error: "Service price is required." }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO services (vendor_id, name, description, price, category, location, image_url, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    vendorId,
    name,
    normalizeText(payload.description),
    price,
    serviceType,
    location,
    normalizeOptionalText(payload.imageUrl),
    payload.isActive === false ? 0 : 1,
  ).run();

  const createdService = await c.env.DB.prepare(
    "SELECT * FROM services WHERE id = ? AND vendor_id = ?"
  ).bind(result.meta.last_row_id, vendorId).first();
  
  return c.json({ id: result.meta.last_row_id, success: true, service: createdService ? serializeService(createdService as Record<string, unknown>) : null });
});

app.put("/api/services/:id", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const id = c.req.param("id");
  const currentService = await c.env.DB.prepare(
    "SELECT * FROM services WHERE id = ? AND vendor_id = ?"
  ).bind(id, vendorId).first();

  if (!currentService) {
    return c.json({ error: "Service not found." }, 404);
  }

  const payload = await c.req.json<Record<string, unknown>>();
  const serviceType = payload.category !== undefined || payload.serviceType !== undefined
    ? resolveServiceType(payload)
    : normalizeText(currentService.category);
  const location = payload.location !== undefined
    ? normalizeText(payload.location)
    : normalizeText(currentService.location);
  const name = payload.name !== undefined
    ? buildServiceName(payload.name, serviceType, location)
    : buildServiceName("", serviceType, location);
  const price = payload.price !== undefined ? Number(payload.price || 0) : Number(currentService.price || 0);

  if (!serviceType) {
    return c.json({ error: "Service type is required." }, 400);
  }
  if (!location) {
    return c.json({ error: "Service location is required." }, 400);
  }
  if (!(price > 0)) {
    return c.json({ error: "Service price is required." }, 400);
  }
  
  await c.env.DB.prepare(`
    UPDATE services SET name = ?, description = ?, price = ?, category = ?, location = ?, image_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND vendor_id = ?
  `).bind(
    name,
    payload.description !== undefined ? normalizeText(payload.description) : normalizeText(currentService.description),
    price,
    serviceType,
    location,
    payload.imageUrl !== undefined
      ? normalizeOptionalText(payload.imageUrl)
      : normalizeOptionalText(currentService.image_url),
    payload.isActive === undefined ? (Number(currentService.is_active ?? 1) === 1 ? 1 : 0) : (payload.isActive ? 1 : 0),
    id,
    vendorId,
  ).run();

  const updatedService = await c.env.DB.prepare(
    "SELECT * FROM services WHERE id = ? AND vendor_id = ?"
  ).bind(id, vendorId).first();
  
  return c.json({ success: true, service: updatedService ? serializeService(updatedService as Record<string, unknown>) : null });
});

app.delete("/api/services/:id", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const id = c.req.param("id");
  
  await c.env.DB.prepare(
    "DELETE FROM services WHERE id = ? AND vendor_id = ?"
  ).bind(id, vendorId).run();
  
  return c.json({ success: true });
});

app.get("/api/bookings", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const bookings = await c.env.DB.prepare(`
    SELECT b.*, s.name as service_name 
    FROM bookings b 
    LEFT JOIN services s ON b.service_id = s.id 
    WHERE b.vendor_id = ? 
    ORDER BY b.event_date DESC
  `).bind(vendorId).all();
  
  return c.json(bookings.results.map(b => ({
    id: b.id,
    clientName: b.client_name,
    clientEmail: b.client_email,
    clientPhone: b.client_phone,
    serviceName: b.service_name,
    serviceId: b.service_id,
    eventDate: b.event_date,
    eventTime: b.event_time,
    notes: b.notes,
    status: b.status,
    amount: b.amount,
    createdAt: b.created_at
  })));
});

app.put("/api/bookings/:id/status", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const id = c.req.param("id");
  const { status } = await c.req.json();
  
  await c.env.DB.prepare(
    "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND vendor_id = ?"
  ).bind(status, id, vendorId).run();
  
  if (status === "completed") {
    const booking = await c.env.DB.prepare(
      "SELECT amount FROM bookings WHERE id = ? AND vendor_id = ?"
    ).bind(id, vendorId).first();
    
    if (booking) {
      await c.env.DB.prepare(`
        INSERT INTO earnings (vendor_id, booking_id, amount, payment_date, payment_method)
        VALUES (?, ?, ?, date('now'), 'Pending')
      `).bind(vendorId, id, booking.amount).run();
    }
  }
  
  return c.json({ success: true });
});

app.get("/api/earnings", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const earnings = await c.env.DB.prepare(`
    SELECT e.*, b.client_name, s.name as service_name
    FROM earnings e
    LEFT JOIN bookings b ON e.booking_id = b.id
    LEFT JOIN services s ON b.service_id = s.id
    WHERE e.vendor_id = ?
    ORDER BY e.payment_date DESC
  `).bind(vendorId).all();
  
  const summary = await c.env.DB.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total,
      COALESCE(SUM(CASE WHEN payment_date >= date('now', 'start of month') THEN amount ELSE 0 END), 0) as this_month,
      COALESCE(SUM(CASE WHEN payment_date >= date('now', '-7 days') THEN amount ELSE 0 END), 0) as this_week
    FROM earnings WHERE vendor_id = ?
  `).bind(vendorId).first();
  
  return c.json({
    earnings: earnings.results.map(e => ({
      id: e.id,
      bookingId: e.booking_id,
      clientName: e.client_name,
      serviceName: e.service_name,
      amount: e.amount,
      paymentDate: e.payment_date,
      paymentMethod: e.payment_method,
      notes: e.notes
    })),
    summary: {
      total: summary?.total || 0,
      thisMonth: summary?.this_month || 0,
      thisWeek: summary?.this_week || 0
    }
  });
});

app.get("/api/availability", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const availability = await c.env.DB.prepare(
    "SELECT * FROM availability WHERE vendor_id = ? ORDER BY date ASC"
  ).bind(vendorId).all();
  
  const bookedDates = await c.env.DB.prepare(
    "SELECT event_date FROM bookings WHERE vendor_id = ? AND status IN ('pending', 'approved')"
  ).bind(vendorId).all();
  
  return c.json({
    availability: availability.results,
    bookedDates: bookedDates.results.map(b => b.event_date)
  });
});

app.post("/api/availability", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const { date, isAvailable, notes } = await c.req.json();
  
  await c.env.DB.prepare(`
    INSERT INTO availability (vendor_id, date, is_available, notes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(vendor_id, date) DO UPDATE SET is_available = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
  `).bind(vendorId, date, isAvailable ? 1 : 0, notes, isAvailable ? 1 : 0, notes).run();
  
  return c.json({ success: true });
});

app.get("/api/bookings/recent", async (c) => {
  const vendorId = getVendorId(c);
  if (!vendorId) return c.json({ error: "Unauthorized" }, 401);
  
  const bookings = await c.env.DB.prepare(`
    SELECT b.*, s.name as service_name 
    FROM bookings b 
    LEFT JOIN services s ON b.service_id = s.id 
    WHERE b.vendor_id = ? 
    ORDER BY b.created_at DESC
    LIMIT 5
  `).bind(vendorId).all();
  
  return c.json(bookings.results.map(b => ({
    id: b.id,
    clientName: b.client_name,
    serviceName: b.service_name,
    eventDate: b.event_date,
    eventTime: b.event_time,
    status: b.status,
    amount: b.amount
  })));
});

function getVendorId(c: { req: { header: (name: string) => string | undefined } }): number | null {
  const auth = c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  
  try {
    const token = auth.slice(7);
    const decoded = JSON.parse(atob(token)) as { exp?: number; id?: number };
    if (decoded.exp < Date.now()) return null;
    return typeof decoded.id === "number" ? decoded.id : null;
  } catch {
    return null;
  }
}

export default app;
