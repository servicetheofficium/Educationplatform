import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    // Strip spaces — Google displays app passwords in groups of 4 for readability
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ""),
  },
});

export async function sendAdminServiceRequestNotification(req: {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  passport_number?: string;
  service_name: string;
  quantity: number;
  notes?: string;
  price_thb: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] Service request: missing env vars →", {
      ADMIN_EMAIL: !!adminEmail,
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
    });
    return;
  }
  await transporter.sendMail({
    from: `"KNC School" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `New Service Request — ${req.service_name} from ${req.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin:0 0 16px;color:#1a1a1a">New Service Request</h2>
        <p style="color:#555;margin:0 0 20px">A new service request has been submitted on the KNC School website.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#555;width:130px">Name</td><td style="padding:6px 0;font-weight:500">${req.name}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${req.email}">${req.email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#555">Phone</td><td style="padding:6px 0;font-weight:500">${req.phone || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Nationality</td><td style="padding:6px 0;font-weight:500">${req.nationality || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Passport No.</td><td style="padding:6px 0;font-weight:500">${req.passport_number || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Service</td><td style="padding:6px 0;font-weight:500">${req.service_name}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Quantity</td><td style="padding:6px 0;font-weight:500">${req.quantity}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Total</td><td style="padding:6px 0;font-weight:600;color:#ea580c">฿${(req.price_thb * req.quantity).toLocaleString()}</td></tr>
          <tr><td style="padding:6px 0;color:#555;vertical-align:top">Notes</td><td style="padding:6px 0">${req.notes || "—"}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">View in Admin Dashboard</a>
        </div>
      </div>
    `,
  });
}

export async function sendAdminStudentAddedNotification(student: {
  name: string;
  email: string;
  phone?: string;
  nationality?: string;
  school_student_id?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] Student added: missing env vars →", {
      ADMIN_EMAIL: !!adminEmail,
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
    });
    return;
  }

  await transporter.sendMail({
    from: `"KNC School" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `New Student Added — ${student.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin:0 0 16px;color:#1a1a1a">New Student Added</h2>
        <p style="color:#555;margin:0 0 20px">A new student was added directly in the admin dashboard.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#555;width:130px">Name</td><td style="padding:6px 0;font-weight:500">${student.name}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${student.email}">${student.email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#555">Phone</td><td style="padding:6px 0;font-weight:500">${student.phone || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Nationality</td><td style="padding:6px 0;font-weight:500">${student.nationality || "—"}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Student ID</td><td style="padding:6px 0;font-weight:500">${student.school_student_id || "—"}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/students" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">View in Admin Dashboard</a>
        </div>
      </div>
    `,
  });
}

export async function sendAdminApplicationNotification(application: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] Application: missing env vars →", {
      ADMIN_EMAIL: !!adminEmail,
      GMAIL_USER: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
    });
    return;
  }

  const courseLine = "";

  await transporter.sendMail({
    from: `"KNC School" <${process.env.GMAIL_USER}>`,
    to: adminEmail,
    subject: `New Application from ${application.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin:0 0 16px;color:#1a1a1a">New Student Application</h2>
        <p style="color:#555;margin:0 0 20px">A new application has been submitted on the KNC School website.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#555;width:130px">Name</td><td style="padding:6px 0;font-weight:500">${application.name}</td></tr>
          <tr><td style="padding:6px 0;color:#555">Email</td><td style="padding:6px 0;font-weight:500"><a href="mailto:${application.email}">${application.email}</a></td></tr>
          <tr><td style="padding:6px 0;color:#555">Phone</td><td style="padding:6px 0;font-weight:500">${application.phone || "—"}</td></tr>
          ${courseLine}
          <tr><td style="padding:6px 0;color:#555;vertical-align:top">Message</td><td style="padding:6px 0">${application.message}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">View in Admin Dashboard</a>
        </div>
      </div>
    `,
  });
}
