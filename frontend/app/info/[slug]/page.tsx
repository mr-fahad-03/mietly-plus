"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ClientNavbar } from "@/components/client-navbar";
import { HomeFooter } from "@/components/home-footer";
import { useSiteLocale } from "@/lib/use-site-locale";
import { Locale } from "@/lib/types";

type ContentSection = {
  id?: string;
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

type InfoContent = {
  title: string;
  intro: string[];
  sections: ContentSection[];
};

type LocalizedInfoPage = Record<Locale, InfoContent>;

const slugAliases: Record<string, string> = {
  "condition-promise": "great-condition-promise",
  "cancel-contract": "cancellation-policy",
  legal: "privacy-policy",
};

const pages: Record<string, LocalizedInfoPage> = {
  "how-it-works": {
    en: {
      title: "How MietlyPlus Works",
      intro: [
        "MietlyPlus gives customers access to useful products without long-term purchase commitment.",
        "Browse, choose your plan, receive your product, and return it when no longer needed.",
      ],
      sections: [
        { heading: "1. Discover products", paragraphs: ["Browse multiple categories or request a product if it is not listed."] },
        { heading: "2. Choose your rental option", paragraphs: ["Each product shows pricing and rental conditions clearly before checkout."] },
        { heading: "3. Verification when needed", paragraphs: ["For selected products, verification or security hold may apply before confirmation."] },
        { heading: "4. Delivery and handover", paragraphs: ["After confirmation, products are prepared and delivered via reliable shipping partners."] },
        { heading: "5. Use without long-term commitment", paragraphs: ["Use the product during the agreed period without long-term storage or resale effort."] },
        { heading: "6. Return or extend", paragraphs: ["Return according to instructions, or extend where available. Products remain in MietlyPlus inventory."] },
      ],
    },
    de: {
      title: "So funktioniert MietlyPlus",
      intro: [
        "MietlyPlus ist für Menschen gemacht, die Produkte nutzen möchten, ohne sie dauerhaft besitzen zu müssen. Anstatt hohe Anschaffungskosten für Dinge zu tragen, die oft nur vorübergehend gebraucht werden, können Kundinnen und Kunden ausgewählte Produkte flexibel mieten und nach der Nutzung unkompliziert zurückgeben.",
        "Unser Ablauf ist bewusst einfach, transparent und praktisch gestaltet.",
      ],
      sections: [
        {
          heading: "1. Produkte aus verschiedenen Kategorien entdecken",
          paragraphs: [
            "Kundinnen und Kunden können in einem wachsenden Sortiment aus verschiedenen Kategorien stöbern, zum Beispiel aus den Bereichen Baby und Familie, Elektronik, Haushalt, Lifestyle, Küche und weiteren nützlichen Produktgruppen.",
            "Falls ein gewünschtes Produkt aktuell nicht verfügbar ist, kann eine Anfrage gestellt werden. Wir prüfen dann, ob wir dieses Produkt künftig anbieten können.",
          ],
        },
        {
          heading: "2. Passende Mietoption wählen",
          paragraphs: [
            "Für jedes Produkt werden Preis, Mietdauer und weitere Bedingungen transparent dargestellt.",
            "Je nach Produktkategorie können unterschiedliche Mindestmietzeiten gelten. Manche Produkte können bereits ab sieben Tagen gemietet werden, andere erst ab einer längeren Mindestlaufzeit, etwa einem Monat.",
            "Die jeweils geltenden Bedingungen sind direkt auf der Produktseite sichtbar.",
          ],
        },
        {
          heading: "3. Verifizierung bei Bedarf",
          paragraphs: [
            "Für bestimmte Produkte, insbesondere höherwertige Artikel, kann vor der Bestätigung einer Bestellung eine zusätzliche Prüfung erforderlich sein.",
            "Dazu können beispielsweise Zahlungsprüfung, Identitätsprüfung oder eine Sicherheitsleistung gehören.",
            "Dies dient dem Schutz unseres Bestands und einem fairen Ablauf für alle Kundinnen und Kunden.",
          ],
        },
        {
          heading: "4. Lieferung und Bereitstellung",
          paragraphs: [
            "Nach erfolgreicher Bestellung wird das Produkt vorbereitet und für den Versand eingeplant.",
            "Lieferzeiten, Versandkosten und gegebenenfalls anfallende Zusatzkosten werden transparent auf der Website angezeigt.",
            "Für die Zustellung arbeiten wir mit zuverlässigen Versandpartnern zusammen.",
          ],
        },
        {
          heading: "5. Nutzen statt besitzen",
          paragraphs: [
            "Während der vereinbarten Mietdauer kann das Produkt ganz einfach genutzt werden, ohne hohe Einmalkosten, ohne langfristige Lagerung und ohne späteren Wiederverkaufsaufwand.",
            "Das Eigentum am Produkt verbleibt jederzeit bei MietlyPlus, sofern nicht ausdrücklich etwas anderes vereinbart wurde.",
          ],
        },
        {
          heading: "6. Zurückgeben, verlängern oder neu anfragen",
          paragraphs: [
            "Nach Ablauf der Mietdauer wird das Produkt gemäß den Rückgabehinweisen zurückgesendet.",
            "Falls vorgesehen, kann die Mietdauer verlängert werden.",
            "Außerdem können Kundinnen und Kunden jederzeit weitere Produkte entdecken oder neue Anfragen stellen.",
            "MietlyPlus steht für Flexibilität, Komfort und einen smarteren Zugang zu Produkten.",
          ],
        },
      ],
    },
  },
  "great-condition-promise": {
    en: {
      title: "Great Condition Promise",
      intro: [
        "Every MietlyPlus product is checked and prepared before delivery.",
        "Products are expected to be functional, complete where applicable, and ready for real use.",
      ],
      sections: [
        { heading: "What customers can expect", paragraphs: ["Products are reviewed for condition, function, and completeness before each rental cycle."] },
        { heading: "Honest expectations", paragraphs: ["Minor cosmetic wear can occur in a circular rental model, but products remain suitable for intended use."] },
        { heading: "If something is not right", paragraphs: ["If an item arrives incomplete, heavily damaged, or not usable, contact MietlyPlus promptly for support."] },
      ],
    },
    de: {
      title: "Unser Qualitätsversprechen",
      intro: [
        "Bei MietlyPlus beginnt Vertrauen mit der Qualität unserer Produkte. Unser Mietmodell funktioniert nur dann nachhaltig, wenn wir Produkte bereitstellen, die funktionstüchtig, vollständig und in einem guten nutzbaren Zustand sind.",
        "Deshalb wird jedes Produkt vor einer neuen Vermietung geprüft.",
      ],
      sections: [
        {
          heading: "Was Kundinnen und Kunden erwarten dürfen",
          paragraphs: [
            "Vor dem Versand prüfen wir Produkte je nach Art und Kategorie auf allgemeinen Zustand, Funktion und Vollständigkeit.",
            "Unser Ziel ist es, dass jedes Produkt, das in einen neuen Mietzyklus geht, für die weitere Nutzung geeignet ist.",
          ],
        },
        {
          heading: "Ehrliche Erwartungen",
          paragraphs: [
            "Da MietlyPlus ein Mietmodell anbietet, können Produkte je nach Kategorie und Nutzungsdauer leichte Gebrauchsspuren aufweisen.",
            "Solche normalen, rein optischen Spuren können bei einem zirkulären Nutzungsmodell vorkommen.",
            "Trotzdem müssen die Produkte funktional zuverlässig und für ihren Zweck geeignet bleiben.",
          ],
        },
        {
          heading: "Sorgfältige Vorbereitung",
          paragraphs: [
            "Vor jedem erneuten Versand werden Produkte entsprechend ihrer Kategorie vorbereitet.",
            "Dabei achten wir auf praktische Einsatzbereitschaft, verantwortungsvollen Umgang und einen verlässlichen Qualitätsstandard.",
          ],
        },
        {
          heading: "Wenn etwas nicht stimmt",
          paragraphs: [
            "Falls ein Produkt unvollständig, erheblich beschädigt oder nicht wie erwartet nutzbar ankommt, sollte MietlyPlus möglichst zeitnah kontaktiert werden.",
            "Wir prüfen den Fall und sorgen je nach Situation für Unterstützung, Ersatz oder eine andere faire Lösung.",
          ],
        },
        {
          heading: "Unser Anspruch",
          paragraphs: [
            "Wir möchten Produkte nicht einfach nur von Person zu Person weitergeben.",
            "MietlyPlus prüft, pflegt und nimmt Produkte bei Bedarf aus dem aktiven Bestand, um einen verlässlichen Standard über mehrere Mietzyklen hinweg sicherzustellen.",
            "Das ist unser Qualitätsversprechen: verantwortungsvoll vorbereitete Produkte, ehrliche Kommunikation und ein hoher Anspruch an das Nutzungserlebnis.",
          ],
        },
      ],
    },
  },
  "mietly-care": {
    en: {
      title: "Mietly Care",
      intro: [
        "Mietly Care supports products and customers throughout the full rental journey.",
        "Our goal is a reliable, simple, and fair experience.",
      ],
      sections: [
        { heading: "Product support", paragraphs: ["Support is available for delivery, condition, use, and return topics during rental."] },
        { heading: "Practical issue handling", paragraphs: ["Depending on the case, we can provide guidance, replacement options, repair coordination, or return support."] },
        { heading: "Fairness in both directions", paragraphs: ["Normal wear is treated differently from negligence, avoidable damage, missing parts, or misuse."] },
      ],
    },
    de: {
      title: "Mietly Care",
      intro: [
        "Mietly Care beschreibt, wie wir Produkte und Kundinnen und Kunden während des gesamten Mietprozesses begleiten.",
        "Mieten soll sich nicht kompliziert oder unsicher anfühlen. Unsere Kundinnen und Kunden sollen wissen, woran sie sind, wie sie Unterstützung erhalten und wie mit den Produkten verantwortungsvoll umgegangen wird.",
      ],
      sections: [
        {
          heading: "Unterstützung rund um das Produkt",
          paragraphs: [
            "Bevor ein Produkt versendet wird, wird es geprüft und für den nächsten Mietzyklus vorbereitet.",
            "Während der Mietdauer können sich Kundinnen und Kunden bei Fragen oder Problemen jederzeit an uns wenden – etwa bei Themen rund um Nutzung, Zustand, Lieferung oder Rückgabe.",
          ],
        },
        {
          heading: "Praktische Hilfe statt unnötiger Hürden",
          paragraphs: [
            "Nicht jedes Problem ist automatisch ein Verschulden. Manche Produkte verschleißen mit der Zeit, und manchmal braucht es einfach Unterstützung im Umgang mit dem Produkt.",
            "Je nach Fall bietet MietlyPlus Hilfestellung, Ersatzmöglichkeiten, Koordination von Reparaturen oder Unterstützung bei der Rückgabe.",
          ],
        },
        {
          heading: "Fairness in beide Richtungen",
          paragraphs: [
            "Wir möchten fair mit unseren Kundinnen und Kunden umgehen und gleichzeitig verantwortungsvoll mit dem Produktbestand arbeiten.",
            "Normale Gebrauchsspuren durch vertragsgemäße Nutzung werden deshalb anders behandelt als vermeidbare Schäden, Fahrlässigkeit, fehlende Teile oder unsachgemäßer Gebrauch.",
          ],
        },
        {
          heading: "Verantwortung über den gesamten Lebenszyklus",
          paragraphs: [
            "Mietly Care bedeutet auch, Produkte zum richtigen Zeitpunkt zu warten, aufzufrischen, zu reparieren oder aus dem Bestand zu nehmen.",
            "Verantwortungsvolle Vermietung heißt auch zu wissen, wann ein Produkt nicht weiter im Umlauf bleiben sollte.",
          ],
        },
        {
          heading: "Klare Unterstützung bei der Rückgabe",
          paragraphs: [
            "Die Rückgabe eines Produkts soll nicht unnötig kompliziert sein.",
            "Deshalb legen wir Wert auf einen klaren, verständlichen und transparenten Rückgabeprozess.",
            "Mietly Care steht für einen Serviceansatz, der auf Fairness, Unterstützung und verantwortungsvollem Umgang basiert.",
          ],
        },
      ],
    },
  },
  sustainability: {
    en: {
      title: "Sustainability at MietlyPlus",
      intro: [
        "Many products are useful without long-term purchase.",
        "Rental keeps quality products in use longer and reduces unnecessary purchases and waste.",
      ],
      sections: [
        { heading: "Smarter access", paragraphs: ["Temporary access can replace repeated purchases where long-term purchase is unnecessary."] },
        { heading: "Longer product lifecycles", paragraphs: ["Products are maintained and reused responsibly while they remain suitable for rental."] },
        { heading: "Responsible retirement", paragraphs: ["Products are retired from circulation when they no longer meet standards."] },
      ],
    },
    de: {
      title: "Nachhaltigkeit bei MietlyPlus",
      intro: [
        "MietlyPlus basiert auf einer einfachen Idee: Viele Produkte müssen nicht dauerhaft besessen werden, um sinnvoll genutzt zu werden. Manche Dinge werden nur für eine bestimmte Lebensphase, für ein Projekt, einen Umzug oder einen begrenzten Zeitraum gebraucht. Der klassische Kauf führt in solchen Fällen oft zu unnötigen Ausgaben, geringer Nutzung, Lagerproblemen und vermeidbarem Abfall.",
        "Unser Modell bietet dafür eine flexible Alternative.",
      ],
      sections: [
        {
          heading: "Zugang statt unnötigem Besitz",
          paragraphs: [
            "Indem geeignete Produkte zur zeitlich begrenzten Nutzung angeboten werden, reduziert MietlyPlus den Bedarf an unnötigen Neuanschaffungen dort, wo Zugang völlig ausreicht.",
          ],
        },
        {
          heading: "Bessere Nutzung hochwertiger Produkte",
          paragraphs: [
            "Gut hergestellte Produkte haben oft eine längere sinnvolle Lebensdauer als nur einen einzelnen Besitzzyklus.",
            "Durch Vermietung können sie effizienter genutzt werden – vorausgesetzt, sie bleiben funktional, geeignet und werden verantwortungsvoll gepflegt.",
          ],
        },
        {
          heading: "Weniger Lagerung, weniger Verschwendung",
          paragraphs: [
            "Kundinnen und Kunden müssen Produkte, die sie später nicht mehr brauchen, weder lagern noch weiterverkaufen oder entsorgen.",
            "Das macht temporäre Nutzung einfacher und oft deutlich sinnvoller.",
          ],
        },
        {
          heading: "Pflege statt vorschnellem Ersatz",
          paragraphs: [
            "Wo es sinnvoll ist, werden Produkte instand gehalten, gepflegt und weiterverwendet, anstatt sie frühzeitig auszusortieren.",
          ],
        },
        {
          heading: "Verantwortungsvolle Ausmusterung",
          paragraphs: [
            "Produkte, die unsere Standards nicht mehr erfüllen oder sich nicht mehr für die weitere Vermietung eignen, werden aus dem aktiven Bestand genommen.",
            "Je nach Produkt können sie weiterverkauft, aufbereitet, recycelt oder anderweitig verantwortungsvoll behandelt werden.",
            "Nachhaltigkeit bei MietlyPlus ist kein reines Schlagwort, sondern Teil des Geschäftsmodells: sinnvoller Zugang, längere Nutzung und weniger unnötiger Besitz.",
          ],
        },
      ],
    },
  },
  "cancellation-policy": {
    en: {
      title: "Right of Withdrawal",
      intro: ["Consumers have a statutory right of withdrawal for distance contracts unless legal exceptions apply."],
      sections: [
        { heading: "Withdrawal period", paragraphs: ["The withdrawal period is fourteen days from the date the contract is concluded."] },
        {
          heading: "Exercise of withdrawal",
          paragraphs: [
            "To exercise withdrawal, inform MietlyPlus by clear statement via email or post.",
            "The sample withdrawal form may be used but is not mandatory.",
          ],
        },
        {
          heading: "Consequences",
          paragraphs: [
            "Reimbursement is made without undue delay and no later than fourteen days after receiving withdrawal notice.",
            "If service started during withdrawal period at customer request, proportional payment may apply.",
            "Delivered products must be returned promptly according to return instructions.",
          ],
        },
      ],
    },
    de: {
      title: "Widerrufsrecht",
      intro: ["Verbraucherinnen und Verbraucher haben bei Fernabsatzverträgen grundsätzlich ein gesetzliches Widerrufsrecht, soweit keine gesetzliche Ausnahme greift."],
      sections: [
        { heading: "Widerrufsfrist", paragraphs: ["Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses."] },
        {
          heading: "Ausübung des Widerrufsrechts",
          paragraphs: [
            "Um dein Widerrufsrecht auszuüben, musst du uns, MietlyPlus, mittels einer eindeutigen Erklärung per E-Mail oder Post über deinen Entschluss informieren, diesen Vertrag zu widerrufen.",
            "Du kannst dafür das untenstehende Muster-Widerrufsformular verwenden, dies ist jedoch nicht verpflichtend.",
          ],
        },
        {
          heading: "Folgen des Widerrufs",
          paragraphs: [
            "Wenn du diesen Vertrag widerrufst, erstatten wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag, an dem deine Mitteilung über den Widerruf bei uns eingegangen ist.",
            "Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, sofern nicht ausdrücklich etwas anderes vereinbart wurde.",
            "Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des Widerrufsrechts unterrichtet hast, bereits erbrachten Leistungen im Vergleich zum Gesamtumfang der vorgesehenen Leistung entspricht.",
            "Falls das Produkt bereits geliefert wurde, ist es unverzüglich entsprechend unserer Rückgabeanweisungen zurückzusenden.",
          ],
        },
        {
          heading: "Muster-Widerrufsformular",
          bullets: [
            "Hiermit widerrufe ich / widerrufen wir den von mir / uns abgeschlossenen Vertrag über die Miete / das Abonnement der folgenden Produkte / Dienstleistungen:",
            "Bestellt am / erhalten am:",
            "Name des / der Verbraucher(s):",
            "Anschrift des / der Verbraucher(s):",
            "Unterschrift des / der Verbraucher(s) (nur bei Mitteilung auf Papier):",
            "Datum:",
          ],
        },
      ],
    },
  },
  "rental-contract": {
    en: {
      title: "Rental Contract Information",
      intro: [
        "MietlyPlus provides products on rental/subscription basis and not as purchase unless explicitly stated.",
        "Products remain in MietlyPlus inventory at all times.",
      ],
      sections: [
        {
          heading: "Contract may include",
          bullets: [
            "rented product and rental start date",
            "monthly or fixed rental fee",
            "minimum rental period",
            "deposit or security hold",
            "verification requirements",
            "delivery and return conditions",
            "customer duties of care",
            "damage, loss, and non-return provisions",
            "termination and cancellation conditions",
          ],
        },
      ],
    },
    de: {
      title: "Informationen zum Mietvertrag",
      intro: [
        "MietlyPlus stellt Produkte auf Miet- beziehungsweise Abonnementbasis zur Verfügung und nicht im Wege eines Verkaufs, sofern nicht ausdrücklich etwas anderes angegeben ist.",
        "Das Eigentum am gemieteten Produkt verbleibt jederzeit bei MietlyPlus.",
      ],
      sections: [
        {
          heading: "Der Mietvertrag kann insbesondere folgende Punkte umfassen",
          bullets: [
            "das gemietete Produkt",
            "den Beginn der Mietdauer",
            "die monatliche oder feste Mietgebühr",
            "die geltende Mindestmietdauer",
            "eine gegebenenfalls erforderliche Kaution oder Sicherheitsleistung",
            "mögliche Verifizierungsanforderungen",
            "Liefer- und Rückgabebedingungen",
            "Sorgfaltspflichten der Kundinnen und Kunden",
            "Regelungen zu Schäden, Verlust und Nicht-Rückgabe",
            "Kündigungs- und Beendigungsbedingungen",
          ],
        },
        {
          paragraphs: [
            "Eine Zusammenfassung der Vertragsbedingungen wird während des Bestellprozesses oder in der Bestellbestätigung bereitgestellt.",
            "Kundinnen und Kunden sollten alle Angaben vor Abschluss der Bestellung sorgfältig prüfen.",
          ],
        },
      ],
    },
  },
  "terms-and-conditions": {
    en: {
      title: "Terms and Conditions of MietlyPlus",
      intro: ["These Terms and Conditions govern rental, subscription use, delivery, return, and related services offered by MietlyPlus."],
      sections: [
        {
          id: "terms",
          heading: "Core clauses",
          bullets: [
            "Contracting party: Muhammad Saad Ahmed, trading as MietlyPlus, Lichtenhainer Strasse 13A, [PLZ, City], Germany, support@mietlyplus.de, VAT ID DE361677268.",
            "Products are provided for temporary use and remain in MietlyPlus inventory unless explicitly transferred in writing.",
            "Orders are accepted only after explicit confirmation/approval/dispatch by MietlyPlus.",
            "Prices are in EUR including statutory VAT where applicable; payments are processed via Stripe.",
            "Verification, deposits, or security holds may apply depending on product value, category, and risk profile.",
            "Minimum rental duration is category-based and never below 7 days; general maximum is 1.5 years unless stated otherwise.",
            "Customers must use products carefully and return on time with included parts, normal wear excepted.",
            "Customers may be liable for avoidable damage, misuse, loss, theft, missing parts, and non-return.",
            "MietlyPlus may terminate for good cause (e.g., payment default, fraud suspicion, non-return, serious breach).",
            "German law applies, excluding UN sales law, unless mandatory consumer law states otherwise.",
          ],
        },
      ],
    },
    de: {
      title: "Allgemeine Geschäftsbedingungen von MietlyPlus",
      intro: [
        "Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen MietlyPlus und Kundinnen bzw. Kunden, die über die Website oder über andere vereinbarte Kommunikationswege hinsichtlich der zeitweisen Überlassung von Produkten auf Miet- oder Abonnementbasis abgeschlossen werden.",
      ],
      sections: [
        {
          id: "terms",
          heading: "1. Geltungsbereich",
          paragraphs: [
            "Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen MietlyPlus und Kundinnen bzw. Kunden, die über die Website oder über andere vereinbarte Kommunikationswege hinsichtlich der zeitweisen Überlassung von Produkten auf Miet- oder Abonnementbasis abgeschlossen werden.",
          ],
        },
        {
          heading: "2. Vertragspartner",
          paragraphs: [
            "Muhammad Saad Ahmed, handelnd unter MietlyPlus, Lichtenhainer Strasse 13A, [PLZ, Ort], Deutschland, E-Mail: support@mietlyplus.de, USt-IdNr.: DE361677268.",
          ],
        },
        {
          heading: "3. Art der Leistung",
          paragraphs: [
            "MietlyPlus bietet Produkte zur zeitlich begrenzten Nutzung auf Miet- oder Abonnementbasis an. Sofern nicht ausdrücklich anders angegeben, erfolgt kein Eigentumsübergang. Sämtliche Produkte bleiben im Eigentum von MietlyPlus.",
          ],
        },
        {
          heading: "4. Angebot und Vertragsschluss",
          paragraphs: [
            "Die Darstellung der Produkte auf der Website stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Abgabe einer Bestellung.",
            "Mit dem Absenden einer Bestellung gibt die Kundin oder der Kunde ein verbindliches Angebot auf Abschluss eines Vertrags ab.",
            "Der Vertrag kommt erst zustande, wenn MietlyPlus die Bestellung annimmt, etwa durch Bestellbestätigung, Freigabe der Bestellung oder Versand des Produkts.",
            "MietlyPlus behält sich vor, Bestellungen insbesondere bei Nichtverfügbarkeit, fehlgeschlagener Verifizierung, Verdacht auf Missbrauch, Zahlungsproblemen oder betrieblichen Gründen abzulehnen.",
          ],
        },
        {
          heading: "5. Berechtigung zum Vertragsschluss",
          paragraphs: [
            "Verträge mit MietlyPlus dürfen nur von Personen abgeschlossen werden, die unbeschränkt geschäftsfähig sind und im Bestellprozess vollständige und zutreffende Angaben machen.",
          ],
        },
        {
          heading: "6. Kundenkonto",
          paragraphs: [
            "Für bestimmte Funktionen kann die Einrichtung eines Kundenkontos erforderlich sein. Kundinnen und Kunden sind verpflichtet, ihre Zugangsdaten vertraulich zu behandeln und vor dem Zugriff Dritter zu schützen.",
          ],
        },
        {
          heading: "7. Preise und Zahlung",
          paragraphs: [
            "Alle Preise werden in Euro angegeben und enthalten die gesetzliche Umsatzsteuer, soweit anwendbar und sofern nichts anderes angegeben ist.",
            "Die Zahlungsabwicklung erfolgt über Stripe. Kundinnen und Kunden sind dafür verantwortlich, dass das angegebene Zahlungsmittel gültig ist und ausreichend Deckung aufweist.",
            "Bei fehlgeschlagenen Zahlungen ist MietlyPlus berechtigt, einen erneuten Einzug zu versuchen, Leistungen auszusetzen, Lieferungen zurückzustellen oder den Vertrag im Rahmen der gesetzlichen Vorschriften zu beenden.",
          ],
          bullets: [
            "wiederkehrende Mietgebühren",
            "einmalige Lieferkosten",
            "Servicegebühren",
            "Kautionen",
            "temporäre Sicherheitsleistungen",
            "Gebühren für Zusatzleistungen",
          ],
        },
        {
          heading: "8. Verifizierung und Betrugsprävention",
          paragraphs: [
            "Für bestimmte Produkte oder Bestellkonstellationen kann MietlyPlus zusätzliche Prüfungen verlangen. Dazu können insbesondere Identitätsprüfungen, zahlungsbezogene Prüfungen, Adressprüfungen oder sonstige Sicherheitsmaßnahmen gehören.",
            "Die Verifizierung kann über Stripe oder andere hierfür eingesetzte Dienstleister erfolgen. Wird eine erforderliche Verifizierung nicht erfolgreich abgeschlossen, ist MietlyPlus berechtigt, die Bestellung abzulehnen, auszusetzen oder zu stornieren.",
          ],
        },
        {
          heading: "9. Kautionen und Sicherheitsleistungen",
          paragraphs: [
            "Für ausgewählte Produkte kann MietlyPlus eine Kaution oder eine temporäre Sicherheitsleistung verlangen. Ob und in welcher Höhe eine solche Sicherheitsleistung anfällt, richtet sich insbesondere nach Produktwert, Produktkategorie, Risikoeinstufung oder sonstigen sachlichen Kriterien.",
            "Eine Kaution oder Sicherheitsleistung begrenzt nicht die Haftung der Kundin oder des Kunden für Verlust, Diebstahl, schwere Beschädigung, fehlende Teile oder Nicht-Rückgabe.",
          ],
        },
        {
          heading: "10. Mietdauer",
          paragraphs: [
            "Die Mindestmietdauer richtet sich nach der jeweiligen Produktkategorie und wird auf der entsprechenden Produktseite angegeben. Die Mindestmietdauer beträgt nie weniger als sieben Tage.",
            "Auch die maximale Mietdauer kann je nach Produkt unterschiedlich sein. Grundsätzlich bietet MietlyPlus keine Mietzeiträume von mehr als 1,5 Jahren an, sofern nicht ausdrücklich etwas anderes angegeben ist.",
          ],
        },
        {
          heading: "11. Lieferung",
          paragraphs: [
            "Die Lieferung erfolgt über externe Versanddienstleister wie DHL, DPD oder Hermes oder über andere geeignete Zustellwege. Lieferzeiten sind unverbindliche Schätzungen, sofern sie nicht ausdrücklich als verbindlich bezeichnet werden.",
            "Kundinnen und Kunden sind verpflichtet, eine korrekte Lieferadresse anzugeben und die ordnungsgemäße Annahme der Lieferung sicherzustellen.",
            "Entstehen zusätzliche Kosten durch fehlerhafte Adressangaben oder fehlgeschlagene Zustellung aus dem Verantwortungsbereich der Kundin oder des Kunden, können diese weiterberechnet werden, soweit gesetzlich zulässig.",
          ],
        },
        {
          heading: "12. Nutzung der Produkte",
          paragraphs: [
            "Gemietete Produkte sind sorgfältig zu behandeln und nur ihrem vorgesehenen Zweck entsprechend zu nutzen. Etwaige Gebrauchsanweisungen, Sicherheitshinweise oder produktspezifische Einschränkungen sind zu beachten.",
          ],
          bullets: [
            "das Produkt zu verkaufen",
            "unbefugt an Dritte weiterzugeben",
            "unterzuvermieten",
            "umzubauen oder zu zerlegen",
            "missbräuchlich zu verwenden",
            "oder in einer Weise zu behandeln, die nicht dem vertragsgemäßen Gebrauch entspricht",
          ],
        },
        {
          heading: "13. Zustand der Produkte",
          paragraphs: [
            "Mietprodukte können leichte Gebrauchsspuren aufweisen, die im Rahmen eines wiederholten Einsatzes üblich sind, sofern sie funktionstüchtig und für den vorgesehenen Gebrauch geeignet bleiben.",
            "Die Kundin oder der Kunde hat das Produkt unverzüglich nach Erhalt zu prüfen und offensichtliche Mängel, Unvollständigkeit oder sonstige Auffälligkeiten unverzüglich mitzuteilen.",
          ],
        },
        {
          heading: "14. Pflichten während der Mietzeit",
          bullets: [
            "das Produkt in angemessenem Zustand zu erhalten",
            "es vor Diebstahl, Verlust und vermeidbaren Schäden zu schützen",
            "MietlyPlus bei Defekten, Störungen, Diebstahl oder Verlust unverzüglich zu informieren",
            "das Produkt nach Ablauf der Mietdauer vollständig zurückzugeben",
            "bei Rückgabe, Abholung oder Klärung von Vorfällen angemessen mitzuwirken",
          ],
        },
        {
          heading: "15. Schäden, Diebstahl, Nicht-Rückgabe und fehlende Teile",
          paragraphs: [
            "Kundinnen und Kunden haften im gesetzlichen Rahmen für Verlust, Diebstahl, erhebliche oder vermeidbare Beschädigungen, fehlende Teile, missbräuchliche Nutzung sowie die nicht fristgerechte oder unterlassene Rückgabe des Produkts.",
            "Normale Gebrauchsspuren durch vertragsgemäße Nutzung sind für sich genommen nicht kostenpflichtig.",
          ],
        },
        {
          heading: "16. Rückgabe",
          paragraphs: [
            "Nach Ablauf der Mietdauer oder nach Beendigung des Vertrags ist das Produkt entsprechend den von MietlyPlus mitgeteilten Rückgabeanweisungen zurückzugeben.",
            "Bei verspäteter Rückgabe ist MietlyPlus berechtigt, die laufenden Mietgebühren weiter zu berechnen, zulässige vertragliche Folgen der verspäteten Rückgabe geltend zu machen und weitere Ansprüche zu verfolgen.",
          ],
        },
        {
          heading: "17. Kündigung und Vertragsbeendigung",
          paragraphs: [
            "Kundinnen und Kunden können laufende Mietverhältnisse nach Maßgabe der jeweils bei Bestellung oder auf der Produktseite angegebenen Kündigungsregelungen beenden.",
            "MietlyPlus ist berechtigt, den Vertrag aus wichtigem Grund zu kündigen, insbesondere bei Zahlungsverzug, Betrugsverdacht, Nicht-Rückgabe, schwerwiegender Vertragsverletzung, missbräuchlicher Nutzung oder Verweigerung erforderlicher Verifizierungs- oder Rückgabeschritte.",
          ],
        },
        {
          heading: "18. Eigentum",
          paragraphs: ["Alle vermieteten Produkte bleiben ausschließliches Eigentum von MietlyPlus, sofern das Eigentum nicht ausdrücklich schriftlich übertragen wird."],
        },
        {
          heading: "19. Haftung",
          paragraphs: [
            "MietlyPlus haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie in den Fällen zwingender gesetzlicher Haftung.",
            "Bei einfacher Fahrlässigkeit haftet MietlyPlus nur bei Verletzung wesentlicher Vertragspflichten und nur auf den vertragstypischen, vorhersehbaren Schaden. Im Übrigen ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.",
            "Keine Haftung besteht für Schäden, die durch unsachgemäße Nutzung, unzulässige Veränderungen, Nichtbeachtung von Anweisungen oder Nutzung außerhalb des vorgesehenen Zwecks entstehen.",
          ],
        },
        {
          heading: "20. Hinweise auf Drittmarken",
          paragraphs: [
            "Nennungen von Drittmarken, Herstellern oder Produktbezeichnungen dienen ausschließlich beschreibenden Zwecken.",
            "Sofern nicht ausdrücklich anders angegeben, besteht keine wirtschaftliche, vertragliche oder autorisierte Verbindung zwischen MietlyPlus und diesen Marken.",
          ],
        },
        {
          heading: "21. Datenschutz",
          paragraphs: ["Informationen zur Verarbeitung personenbezogener Daten finden sich in der Datenschutzerklärung."],
        },
        {
          heading: "22. Anwendbares Recht",
          paragraphs: ["Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit nicht zwingende verbraucherschützende Vorschriften entgegenstehen."],
        },
        {
          heading: "23. Salvatorische Klausel",
          paragraphs: ["Sollte eine Bestimmung dieser AGB ganz oder teilweise unwirksam oder undurchführbar sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt."],
        },
      ],
    },
  },
  "privacy-policy": {
    en: {
      title: "Privacy Policy of MietlyPlus",
      intro: [
        "This policy explains how MietlyPlus processes personal data for website operation, rentals, payments, verification, support, and legal compliance.",
      ],
      sections: [
        {
          id: "privacy",
          heading: "Controller",
          paragraphs: [
            "Muhammad Saad Ahmed, trading as MietlyPlus, Lichtenhainer Strasse 13A, [PLZ, City], Germany, support@mietlyplus.de, VAT ID DE361677268.",
          ],
        },
        {
          heading: "Data categories and purposes",
          bullets: [
            "identity and contact data (name, email, addresses)",
            "account/order/rental/payment data",
            "verification status and support communication",
            "technical and security data for site operation",
          ],
        },
        {
          heading: "Legal bases",
          bullets: [
            "Art. 6(1)(b) GDPR for contract performance",
            "Art. 6(1)(c) GDPR for legal obligations",
            "Art. 6(1)(f) GDPR for legitimate interests (fraud prevention, IT security, operational reliability)",
            "Art. 6(1)(a) GDPR where consent is required",
          ],
        },
        {
          id: "cookies",
          heading: "Cookies",
          paragraphs: [
            "Essential cookies are used for core functionality, security, checkout, and session stability.",
            "Non-essential cookies (analytics/marketing) are activated only with consent.",
          ],
        },
      ],
    },
    de: {
      title: "Datenschutzerklärung von MietlyPlus",
      intro: [
        "Der Schutz personenbezogener Daten ist uns wichtig. Diese Datenschutzerklärung erläutert, welche personenbezogenen Daten wir verarbeiten, wenn du unsere Website besuchst, Produkte mietest, mit uns Kontakt aufnimmst oder unsere Leistungen nutzt.",
      ],
      sections: [
        {
          id: "privacy",
          heading: "1. Verantwortlicher",
          paragraphs: [
            "Muhammad Saad Ahmed, handelnd unter MietlyPlus, Lichtenhainer Strasse 13A, [PLZ, Ort], Deutschland, E-Mail: support@mietlyplus.de, USt-IdNr.: DE361677268.",
          ],
        },
        {
          heading: "2. Allgemeine Hinweise",
          paragraphs: [
            "Der Schutz personenbezogener Daten ist uns wichtig. Diese Datenschutzerklärung erläutert, welche personenbezogenen Daten wir verarbeiten, wenn du unsere Website besuchst, Produkte mietest, mit uns Kontakt aufnimmst oder unsere Leistungen nutzt.",
          ],
        },
        {
          heading: "3. Arten der verarbeiteten Daten",
          bullets: [
            "Name",
            "Rechnungs- und Lieferadresse",
            "E-Mail-Adresse",
            "Kontoinformationen",
            "Bestell- und Mietdaten",
            "zahlungsbezogene Informationen",
            "Kommunikationsinhalte",
            "Verifizierungsstatus",
            "Rückgabe- und Supportdaten",
            "technisch erforderliche Nutzungsdaten",
          ],
        },
        {
          heading: "4. Zwecke der Verarbeitung",
          bullets: [
            "zur Bereitstellung der Website",
            "zur Durchführung von Bestellungen und Mietverträgen",
            "zur Lieferung und Rückgabe von Produkten",
            "zur Zahlungsabwicklung",
            "zur Durchführung von Verifizierungen",
            "zur Betrugsprävention",
            "zur Kundenbetreuung",
            "zur Erfüllung gesetzlicher Pflichten",
            "zur Durchsetzung vertraglicher Ansprüche",
            "zur Gewährleistung von IT-Sicherheit",
          ],
        },
        {
          heading: "5. Rechtsgrundlagen",
          bullets: [
            "Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung und Durchführung vorvertraglicher Maßnahmen",
            "Art. 6 Abs. 1 lit. c DSGVO zur Erfüllung rechtlicher Verpflichtungen",
            "Art. 6 Abs. 1 lit. f DSGVO auf Grundlage berechtigter Interessen, insbesondere zur Betrugsprävention, Systemsicherheit und geordneten Betriebsabwicklung",
            "Art. 6 Abs. 1 lit. a DSGVO, soweit eine Einwilligung erforderlich ist",
          ],
        },
        {
          heading: "6. Zahlungsabwicklung",
          paragraphs: [
            "Die Zahlungsabwicklung erfolgt über Stripe. In diesem Zusammenhang werden die zur Durchführung der Zahlung erforderlichen Daten an Stripe übermittelt.",
            "Stripe verarbeitet diese Daten nach Maßgabe der eigenen Datenschutzhinweise und gesetzlichen Verpflichtungen.",
          ],
        },
        {
          heading: "7. Verifizierung und Betrugsprävention",
          paragraphs: [
            "Für bestimmte Produkte können zusätzliche Prüfungen erforderlich sein. Hierzu können insbesondere Identitätsprüfungen, zahlungsbezogene Prüfungen oder sonstige Maßnahmen zur Betrugsvermeidung gehören.",
            "Soweit erforderlich, erfolgen solche Prüfungen über Stripe oder andere eingesetzte Dienstleister.",
            "Wir verarbeiten dabei nur die Informationen, die zur Bestätigung des Prüfergebnisses oder zur Vertragsdurchführung notwendig sind.",
          ],
        },
        {
          heading: "8. Versand und Logistik",
          paragraphs: [
            "Zur Durchführung von Lieferung und Rücksendung können erforderliche Daten wie Name, Anschrift und lieferbezogene Informationen an Versanddienstleister wie DHL, DPD und Hermes übermittelt werden, soweit dies zur Vertragserfüllung erforderlich ist.",
          ],
        },
        {
          heading: "9. Kontaktaufnahme",
          paragraphs: [
            "Wenn du uns per E-Mail oder über ein Kontaktformular kontaktierst, verarbeiten wir die von dir mitgeteilten Daten zur Bearbeitung deiner Anfrage und für eventuelle Anschlusskommunikation.",
          ],
        },
        {
          heading: "10. Produktanfragen",
          paragraphs: [
            "Wenn du ein Produkt anfragst, das aktuell nicht im Sortiment verfügbar ist, verarbeiten wir die von dir übermittelten Angaben, um deine Anfrage zu prüfen, dich zu kontaktieren und dich gegebenenfalls zu informieren, falls das gewünschte Produkt verfügbar wird.",
          ],
        },
        {
          id: "cookies",
          heading: "11. Cookies",
          paragraphs: [
            "Unsere Website verwendet Cookies und ähnliche Technologien, die für den technischen Betrieb der Website, die Stabilität von Sitzungen, den Checkout-Prozess und Sicherheitsfunktionen erforderlich sind.",
            "Soweit künftig nicht erforderliche Cookies, insbesondere Analyse- oder Marketing-Cookies, eingesetzt werden, geschieht dies erst nach entsprechender Einwilligung über das Cookie-Banner.",
          ],
        },
        {
          heading: "12. Empfänger",
          bullets: [
            "Zahlungsdienstleister",
            "Verifizierungsdienstleister",
            "Versand- und Logistikpartner",
            "Hosting- und technische Dienstleister",
            "steuerliche oder rechtliche Berater",
            "Behörden, soweit eine gesetzliche Verpflichtung besteht",
          ],
        },
        {
          heading: "13. Speicherdauer",
          paragraphs: [
            "Wir speichern personenbezogene Daten nur so lange, wie dies für den jeweiligen Zweck, die Vertragsdurchführung, gesetzliche Aufbewahrungsfristen oder berechtigte Interessen erforderlich ist.",
            "Danach werden die Daten gelöscht oder ihre Verarbeitung eingeschränkt, soweit keine weitere gesetzliche Aufbewahrungspflicht besteht.",
          ],
        },
        {
          heading: "14. Deine Rechte",
          bullets: [
            "Recht auf Auskunft",
            "Recht auf Berichtigung",
            "Recht auf Löschung",
            "Recht auf Einschränkung der Verarbeitung",
            "Recht auf Widerspruch",
            "Recht auf Datenübertragbarkeit",
            "Recht auf Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft",
            "Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde",
          ],
        },
        {
          heading: "15. Sicherheit",
          paragraphs: [
            "Wir treffen angemessene technische und organisatorische Maßnahmen, um personenbezogene Daten vor unbefugtem Zugriff, Verlust, Missbrauch und unzulässiger Verarbeitung zu schützen.",
          ],
        },
        {
          heading: "16. Änderungen",
          paragraphs: [
            "Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn dies aufgrund rechtlicher, technischer oder organisatorischer Änderungen erforderlich wird.",
            "Maßgeblich ist jeweils die auf der Website veröffentlichte Fassung.",
          ],
        },
      ],
    },
  },
  imprint: {
    en: {
      title: "Imprint",
      intro: ["Information according to Section 5 TMG"],
      sections: [
        {
          id: "imprint",
          bullets: [
            "Muhammad Saad Ahmed",
            "trading as MietlyPlus",
            "Lichtenhainer Strasse 13A",
            "[PLZ, City]",
            "Germany",
            "Email: support@mietlyplus.de",
            "VAT ID (Section 27a UStG): DE361677268",
            "Responsible for content (Section 18 para. 2 MStV): Muhammad Saad Ahmed, Lichtenhainer Strasse 13A, [PLZ, City], Germany",
          ],
        },
      ],
    },
    de: {
      title: "Impressum",
      intro: ["Angaben gemäß § 5 TMG"],
      sections: [
        {
          id: "imprint",
          bullets: [
            "Muhammad Saad Ahmed",
            "handelnd unter MietlyPlus",
            "Lichtenhainer Strasse 13A",
            "[PLZ, Ort]",
            "Deutschland",
            "E-Mail: support@mietlyplus.de",
            "Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: DE361677268",
            "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: Muhammad Saad Ahmed, Lichtenhainer Strasse 13A, [PLZ, Ort], Deutschland",
          ],
        },
      ],
    },
  },
};

const notFoundCopy = {
  en: { title: "Page Not Found", body: "The requested info page does not exist." },
  de: { title: "Seite nicht gefunden", body: "Die angeforderte Informationsseite existiert nicht." },
} as const;

export default function InfoPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const slug = Array.isArray(slugParam) ? String(slugParam[0] || "") : String(slugParam || "");
  const { locale } = useSiteLocale("de");

  const content = useMemo(() => {
    const normalizedSlug = slugAliases[slug] || slug;
    const page = pages[normalizedSlug as keyof typeof pages];
    return page ? page[locale] : null;
  }, [slug, locale]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dff1f6_0%,#f8fcfd_40%,#ffffff_75%)]">
      <ClientNavbar />
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-14 pt-10">
        {content ? (
          <>
            <section className="rounded-[28px] border border-[rgba(73,153,173,0.24)] bg-white p-7 shadow-[0_24px_60px_rgba(20,30,50,0.08)] md:p-10">
              <h1 className="text-3xl font-black text-zinc-900 md:text-5xl">{content.title}</h1>
              <div className="mt-5 space-y-3 text-[15px] leading-8 text-zinc-700 md:text-lg">
                {content.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="mt-6 space-y-4">
              {content.sections.map((section, index) => (
                <article
                  key={`${section.heading || "section"}-${index}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_12px_36px_-28px_rgba(24,24,27,0.5)] md:p-6"
                >
                  {section.heading ? (
                    <h2 id={section.id} className="text-xl font-bold text-zinc-900 md:text-2xl">
                      {section.heading}
                    </h2>
                  ) : null}

                  {section.paragraphs?.length ? (
                    <div className="mt-3 space-y-3 text-sm leading-7 text-zinc-700 md:text-base">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}

                  {section.bullets?.length ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700 md:text-base">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-zinc-200 bg-white p-7">
            <h1 className="text-4xl font-extrabold text-zinc-900">{notFoundCopy[locale].title}</h1>
            <p className="mt-4 text-lg leading-8 text-zinc-700">{notFoundCopy[locale].body}</p>
          </section>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
