/**
 * Modul M347 - Dienste mit Containern
 *
 * Dies ist ein Demo-Server, welcher eine monolithische Web-Applikation umsetzt:
 *
 * - alle Dateien unter site/ werden als statischen Content ausgeliefert
 * - die Route "/feedback" nimmt einen url-encoded Form-Post entgegen,
 *   und versendet ein Feedback-Email mit den Daten. Als Fake-Email-Server wird ethereal.email
 *   verwendet.
 *
 * API-Routen:
 * - die Route '/api/save-text' nimmt via Form-Post einen Text-Input entgegen, und speichert diesen
 *   demomässig in einer Datenbank-Tabelle.
 * - die Route '/api/get-texts' liefert die zuvor gespeicherten Texte wieder aus.
 *
 * ANMERKUNG:
 * Diese Applikation ist unschön, unsicher und monolithisch BY DESIGN!
 * Ziel ist, diese Applikation im Verlauf des Moduls M347 in einzelne Dienste / Container zu
 * "entwirren".
 *
 * (c) Alexander Schenkel, alexander.schenkel@bztf.ch
 */
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const config = require("./config/config.js");

const app = express();
const port = config.server.port;

/** 
 * Datenbank konfigurieren: 
 * 
 * Siehe Konfiguration in config/config.js, Abschnitt "Database":
 */
const knex = require("knex")({
  client: config.database.client,
  connection: config.database.connection,
  pool: {
    afterCreate: function (conn, done) {
      if (config.database.initialSql) {
        conn.exec(config.database.initialSql, (err) => {
          done(err, done);
        });
      } else {
        done();
      }
    },
  },
});

/** ------------------- URL-Routen und -Handler konfigurieren -------------------- */

// Wir registrieren einen Route-Handler für die
// Route '/feedback': Unser Formular schickt seine Daten hierhin
app.post(
  "/feedback",
  // die body-parser-Middleware erlaubt das Auslesen von
  // Formulardaten, hier in der urlencoded-Form:
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    // Wir verarbeiten die Form-Daten:
    let name = req.body.name;
    let vorname = req.body.vorname;
    console.log(`name: ${name}`);
    console.log(`vorname: ${vorname}`);

    // Hier lösen wir das Feedback-Email aus:
    sendFeedbackEmail(name, vorname);

    // ... und leiten den Browser zu einer Dankes-Seite um:
    res.redirect("/thankyou.html");
  }
);

// Route: '/api/save-text', mit aktivierten CORS-Headern,
// um Cross-Domain-Requests zu ermöglichen:
app
  .route("/api/save-text")
  .options(cors())
  .post(cors(), bodyParser.json(), async (req, res) => {
    if (req.body.text) {
      try {
        let result = await knex("textinput").insert({
          textinput: req.body.text,
        });
        res.json(result);
      } catch (e) {
        console.log(e);
        res.status(500).send(e.message);
      }
    }
    res.end();
  });

// Route: '/api/save-text', mit aktivierten CORS-Headern,
// um Cross-Domain-Requests zu ermöglichen:
app
  .route("/api/save-text")
  .options(cors())
  .post(cors(), bodyParser.json(), async (req, res) => {
    // Wir speichern hier den gelieferten Text in der Datenbank:
    if (req.body.text) {
      try {
        let result = await knex("textinput").insert({
          textinput: req.body.text,
        });
        res.json(result);
      } catch (e) {
        res.status(500).send(e.message);
      }
    }
    res.end();
  });

// Route: '/api/get-texts', mit aktivierten CORS-Headern,
// um Cross-Domain-Requests zu ermöglichen:
// Liefert die in der Tabelle 'textinputs' gespeicherten Einträge
app.route("/api/get-texts").get(cors(), async (req, res) => {
  try {
    let result = await knex("textinput").select("*");
    // Wir erstellen hier gleich eine HTML-Tabelle als Response:
    if (result && result.length) {
      let rows = result.map((row) => {
        return `<tr><td>${row.id}</td><td>${row.textinput}</td></tr>`;
      });
      let table = `
      <table>
        <thead><tr><th>ID</th><th>Text</th></tr></thead>
        <tbody>
        ${rows.join("")}
        </tbody>
      </table>
      `;
      res.send(table);
    } else {
      res.send("keine Resultate");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send(e.message);
  }
});

// statische (Frontend)-Site: alle Files unter site/ werden
// als statische Dateien ausgeliefert:
// Diesen Teil wollen wir später vom Backend-Server lösen:
app.use(express.static("site"));

// ---------------------------------------------------------------
// Starten des Servers und Konfigurieren unseres Email-Demos:
let emailTransport = null;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);

  // Email-Setup, hier mit dem Fake-Dienst ethereal.email:
  setupEmail().then((transport) => {
    emailTransport = transport;
  });
});
// ---------------------------------------------------------------




// ---------------------------------------------------------------
/**
 * Hilfsfunktion: konfiguriert einen Email-Transport für nodemailer,
 * hier mit dem Test-Maildienst ethereal.email. Liefert den transport
 * mittels einer Promise.
 */
function setupEmail() {
  return new Promise((resolve, reject) => {
    // Setting up fake email using ethereal.email:
    // Generate SMTP service account from ethereal.email
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        console.error("Failed to create a testing account. " + err.message);
        return process.exit(1);
      }

      console.log("Credentials obtained");

      // Create a SMTP transporter object
      let emailTransport = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });

      resolve(emailTransport);
    });
  });
}

/**
 * Sendet die Feedback-Daten per Mail an den vorkonfigurierten Mail-Transport
 */
function sendFeedbackEmail(name, vorname) {
  // Message object
  let message = {
    from: "Sender Name <sender@example.com>",
    to: "Recipient <recipient@example.com>",
    subject: "Feedback-Formular",
    text: `Feedback von ${name}, ${vorname} erhalten.`,
    html: `<p>Feedback von <b>${name}, ${vorname}</b> erhalten.</p>`,
  };

  emailTransport.sendMail(message, (err, info) => {
    if (err) {
      console.log("Error occurred. " + err.message);
      return process.exit(1);
    }

    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  });
}
