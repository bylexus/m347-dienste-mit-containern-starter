# Modul M347 - Dienste mit Containern

Dies ist das Einstiegsprojekt für das Modul M345. Es besteht aus:

* `mkdocs`: Einem mkdocs-Skelet für die Erstellung der Projektdokumentation
* `monolith`: Einem Einstiegs-Projekt, als monolithische Applikation implementiert,
	welche im Lauf des Moduls in mehrere Dienste aufgetrennt wird.


Die monolithische Applikation besteht aus:

* einem static site builder, welcher die Frontend-Webseite bildet / generiert
* einem kleinen nodejs-Webserver (expressjs), welcher die statische Site ausliefern kann 
  und eine Demo-API-Route implementiert, um:
  * eine Backend-API zu demonstrieren
  * den Datenbank-Zugriff zu demonstrieren
* einem Mail-Dienst. Dieser kann extern sein, wir verwenden beispielhaft ethereal.email

## Bilden der statischen Webseite

Der Frontend-Teil besteht aus der statisch gebildeten Webseite, welche der Server
unter `monolith/site/` ausliefert. Diese kann/muss (manuell) gebildet werden:

Wir benutzen die Static-Site-Builder-Infrastruktur aus dem letzten Modul M293:
Diese bildet anhand von Templates die Seite unter `monolith/src/` als
fertig generierte HTML-Seiten nach `monolith/site/`.

```sh
$ cd monolith/
$ npm install  # einmalig
$npm run build # bildet monolith/src/ --> monolith/site/
```

Dies erstellt / kopiert die statischen Webseiten-Files nach `monolith/site`,
wo sie vom Server (siehe unten) ausgeliefert werden können.

Wenn das Docker-Image verwendet wird, kann dies folgendermassen angestosssen werden:


```sh
# unter unix-artigen Systemen:
$       cd monolith/
$       docker run --rm -ti -v "$(pwd)":/app -w /app node:16 bash
docker> npm install
docker> npm run build

# unter Windows:
$ cd monolith/
$ docker run --rm -ti -v "%cd%":/app -w /app node:16 bash
docker> npm install
docker> npm run build

# unter Windows mit PowerShell:
$ cd monolith/
$ docker run --rm -ti -v "$pwd":/app -w /app node:16 bash
docker> npm install
docker> npm run build
```


## Starten des Monolithen

Die monolithische Applikation kann mit dem `server.js`-Script gestartet werden. Es startet einen
kleinen Webserver, basierend auf NodeJS / ExpressJS, und liefert die statischen Seiten unter `site` aus:

```sh
$ cd monolith/
$ npm install # einmalig
$ node server.js
```

Oder mittels einem Docker-Image (Hier: NodeJS 16-Image vom dockerhub):

```sh
# unter unix-artigen Systemen:
$ cd monolith/
$ docker run --rm -ti -v "$(pwd)":/app -w /app -p 3000:3000 node:16 node server.js

# unter Windows:
$ cd monolith/
$ docker run --rm -ti -v "%cd%":/app -w /app -p 3000:3000 node:16 node server.js

# unter Windows mit PowerShell:
$ cd monolith/
$ docker run --rm -ti -v "$pwd":/app -w /app -p 3000:3000 node:16 node server.js
```

Der Server läuft nun auf TCP Port `3000` und liefert Ihre statische Seite unter `monolith/site/` aus.

## Ziel für den Ausbau

Wir behandeln in diesem Modul Dienste mit Containern. Wir nehmen dazu Ihre Projektarbeit aus dem letzten Modul M293,
und bauen diese statische Seite aus:

* ein Container liefert Ihre statische Seite aus (Schritt 1)
* ein Formular-Dienst-Container nimmt Daten aus einem Feedback-Formular entgegen, und
  * schickt diese als Email an eine Adresse (Schritt 2)
  * speichert das Feedback in einer Datenbank (Schritt 3)
* ihre Webseite soll Kommentaren auf den einzelnen Seiten anbieten können: dazu
	entwickeln Sie einen weiteren Dienst als Container, welcher Kommentare pro Seite entgegennehmen / ausliefern kann

Ziel ist, dass die jetzt monolithische Applikation in ein paar "Micro-Services" aufgetrennt wird, welche
als Container-Dienste zusammenspielen.

