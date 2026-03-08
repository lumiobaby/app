// /api/waitlist.js
// Vercel Serverless Function
//
// Instalacija:
//   npm install resend
//
// Environment varijable na Vercel dashboardu:
//   RESEND_API_KEY  →  tvoj API ključ sa resend.com
//   FROM_EMAIL      →  hello@lumio.baby (mora biti verifikovan u Resend)

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Confirmation emailovi na 3 jezika
const emails = {
  en: {
    subject: "You're on the Lumio waitlist! 🎉",
    body: `Hi there!

You're officially on the Lumio waitlist. 🎉

When we launch, you'll get 6 months of premium for free — just for being an early supporter.

We'll keep you posted!

— Lumio team 👶`
  },
  sr: {
    subject: "Na Lumio listi si! 🎉",
    body: `Zdravo!

Uspešno si na Lumio waitlisti. 🎉

Kad lansiramo, dobijaš 6 meseci premiuma besplatno — samo zato što si među prvima.

Javićemo se!

— Lumio tim 👶`
  },
  ru: {
    subject: "Вы в списке ожидания Lumio! 🎉",
    body: `Привет!

Вы официально в листе ожидания Lumio. 🎉

При запуске вы получите 6 месяцев премиума бесплатно.

До скорой встречи!

— Команда Lumio 👶`
  }
};

module.exports = async function handler(req, res) {
    // Samo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, problem, language = "en" } = req.body;

  // Validacija
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    const lang = emails[language] ? language : "en";

    // 1. Dodaj kontakt u Resend Audience listu
    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID,
      // Čuvamo i odgovor na pitanje kao metadata
      ...(problem && { firstName: "", lastName: "", data: { problem, language } })
    });

    // 2. Pošalji confirmation email korisniku
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: emails[lang].subject,
      text: emails[lang].body
    });

    // 3. Obavesti tebe kao osnivača (opciono ali korisno)
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: 'lumiobaby@gmail.com',
      subject: `🎉 New Lumio signup: ${email}`,
      text: `New waitlist signup!\n\nEmail: ${email}\nLanguage: ${language}\nProblem: ${problem || "—"}`
    });

    return res.status(200).json({ message: "Successfully joined the waitlist!" });

  } catch (err) {
    console.error("Waitlist error:", err);

    // Resend vraća grešku ako email već postoji u listi
    if (err.message?.includes("already exists")) {
      return res.status(400).json({ error: "Email already on waitlist." });
    }

    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}