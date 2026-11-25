# HD FREE → EMAIL → BLUEPRINT (CZ / EN) — release candidate

Status: DRAFT, no live Brevo lists, workflows, forms or emails created by this change. Never activate ads on the basis of this document alone.

## Architecture and setup
Use existing Brevo account, not a new vendor. Create two NEW dedicated lists HD_FREE_CONFIRMED_CS and HD_FREE_CONFIRMED_EN and two hosted signup forms. Do not import historical Google users, orders, quiz emails or newsletter contacts without evidence of appropriate consent. Configure email only, explicit unticked consent to receive the five lessons and Blueprint offers, controller identity/contact and privacy notice, CAPTCHA and native double opt-in (DOI). Record consent wording/version and confirmation evidence. Confirmed list entry must occur only after the recipient clicks their confirmation link. Use verified sending identity, DKIM/SPF/DMARC as applicable, real business identity/address and working unsubscribe in every marketing message. Do not create misleading limited-time discounts. Do not share date/time/place of birth or chart data with Brevo.
Use consent text:
CS: Chci dostávat pět e-mailových lekcí o Human Design a nabídky osobního Blueprintu. Odběr mohu kdykoli odvolat.
EN: I would like to receive five Human Design email lessons and Personal Blueprint offers. I can unsubscribe at any time.
Publish hosted forms and set public build-time VITE_HD_BREVO_SIGNUP_CS and VITE_HD_BREVO_SIGNUP_EN to the real corresponding HTTPS sibforms.com URLs. Do not put keys in VITE variables. The result page card stays hidden without a valid URL. It opens the form in a new tab with no referrer or chart data; no marketing enrollment from quiz or Google login. Existing legacy popups are retired because their promised PDF delivery is not verified in Pages. No new DB migrations.
In Brevo Automations: create one workflow per confirmed list; trigger contact added to that list; no repeat entry; send five marketing templates at day 0, 1, 3, 5, 7 after confirmation. Use waits of 1, 2, 2, 2 days. Check subscription/suppression before each send, immediately exit upon unsubscribe, hard bounce or complaint. Stop sales sequence on verified purchase if an appropriate paid-customer suppression integration has been verified; otherwise do not claim this automation works and use verified buyer suppression before enabling the sales steps. After day 7 stop; no automatic ongoing newsletter outside scope. Do not activate until both language workflows, footer and suppression pass isolated tests. Native Brevo automation guide: https://help.brevo.com/hc/en-us/articles/15445989568402 ; form guide: https://help.brevo.com/hc/en-us/articles/208771869 ; consent guidance: https://uoou.gov.cz/cinnost/obchodni-sdeleni/casto-kladene-otazky-k-zakonu-c-4802004-sb

## Templates (copy into Brevo, add actual sender identity and native unsubscribe footer)
All messages are part of the agreed five-email course and clearly identify the brand and optional commercial offer. Use fixed canonical public URLs with UTMs. No personal details or birth data in URLs. Verify destination before enabling. Human Design is a symbolic self-reflection system, not a scientific diagnosis.

### CS
**D0 — Human Design Mapa | Lekce 1: Jak číst svou mapu**
Vítejte v minikurzu! Začněte třemi pojmy: typ, strategie a autorita. Typ popisuje roli v rámci systému, strategie jeho doporučený způsob jednání a autorita způsob, jak zkoumat rozhodování. Berte je jako podněty k sebereflexi, ne jako pevná pravidla. Zkuste si znovu otevřít bezplatnou kalkulačku a najít tyto tři položky.
CTA: Prozkoumat mapu zdarma — https://humandesignmapa.cz/cs/human-design-kalkulacka?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_cs&utm_content=d0

**D1 — Human Design Mapa | Lekce 2: Co znamená váš typ?**
Generátor, manifestující generátor, projektor, manifestor a reflektor jsou pět typů v Human Design. Každý nabízí odlišný rámec pro pozorování vlastního jednání. Dnes si všimněte situace, kdy jste jednali spontánně, a situace, kdy jste potřebovali více času. Co vám vyhovovalo?
CTA: Prozkoumat pět typů — https://humandesignmapa.cz/cs/human-design-typy?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_cs&utm_content=d1

**D3 — Human Design Mapa | Lekce 3: Strategie a autorita v praxi**
Vyberte si jedno drobné rozhodnutí. Všímejte si svých reakcí a toho, co se změní, když si dopřejete čas. Nejde o správnou či špatnou odpověď. Human Design můžete využít jako námět k deníku a pozorování. U závažných rozhodnutí se opírejte také o fakta.
CTA: Vrátit se ke kalkulačce — https://humandesignmapa.cz/cs/human-design-kalkulacka?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_cs&utm_content=d3

**D5 — Human Design Mapa | Lekce 4: Co nabízí osobní Blueprint**
Základní mapa je zdarma. Pokud vás zaujala, osobní Blueprint nabízí podrobnější výklad a navazující AI výklady. Rozdíl mezi bezplatnou a placenou verzí i aktuální cenu najdete na stránce nabídky. Rozhodnutí je na vás.
CTA: Prohlédnout nabídku Blueprintu — https://humandesignmapa.cz/cs/honorace?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_cs&utm_content=d5

**D7 — Human Design Mapa | Lekce 5: Kam dál s vaší mapou?**
Minikurz končí. Vyberte si jeden postřeh z posledního týdne, který stojí za další zkoumání. Pokud chcete pokračovat podrobnějším výkladem, prohlédněte si osobní Blueprint. Bezplatná kalkulačka vám zůstává k dispozici. Děkujeme za váš čas!
CTA: Objevit osobní Blueprint — https://humandesignmapa.cz/cs/honorace?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_cs&utm_content=d7

### EN
**D0 — Human Design Chart | Lesson 1: Read your chart**
Welcome to your free series. Start with three terms: type, strategy and authority. Within the Human Design system, they offer a way to reflect on how you act and make decisions. Treat them as prompts for reflection, not fixed rules. Revisit the free calculator to find these three elements.
CTA: Explore your free chart — https://humandesignchart.app/en/calculate?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_en&utm_content=d0

**D1 — Human Design Chart | Lesson 2: Explore your type**
Generator, Manifesting Generator, Projector, Manifestor and Reflector are the five types in Human Design. Each suggests a different lens for observing your actions. Notice one situation in which you acted spontaneously and another in which you needed time. What worked for you?
CTA: Discover the five types — https://humandesignchart.app/en/human-design-typy?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_en&utm_content=d1

**D3 — Human Design Chart | Lesson 3: Strategy and authority**
Choose one small decision today. Notice your reactions and what changes when you give yourself time. There is no single right answer. Use Human Design as a journaling prompt, alongside facts and practical judgment.
CTA: Revisit your free chart — https://humandesignchart.app/en/calculate?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_en&utm_content=d3

**D5 — Human Design Chart | Lesson 4: Discover the Personal Blueprint**
Your basic chart is free. If you'd like to explore further, the Personal Blueprint offers a more detailed interpretation and follow-up AI readings. See the current offer and price before deciding.
CTA: Explore the Personal Blueprint — https://humandesignchart.app/en/honorace?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_en&utm_content=d5

**D7 — Human Design Chart | Lesson 5: Your next step**
You've reached the end of the series. Pick one insight from this week that you would like to explore further. If you want a more detailed interpretation, take a look at the Personal Blueprint. Your free calculator remains available. Thank you for joining us!
CTA: View the Personal Blueprint — https://humandesignchart.app/en/honorace?utm_source=brevo&utm_medium=email&utm_campaign=hd_free_en&utm_content=d7

## Pilot metrics and acceptance
- Campaigns remain paused. CPC settings as of 25 Nov: CZ target average 2 CZK, US fixed max 3 CZK, 250 CZK lifetime cap each. Start CZ first only with explicit activation approval.
- Measure ad spend, clicks, free chart completion, verified DOI subscribers by form/list, confirmed lead cost, email clicks, paid orders, net collected revenue after fees/refunds. Never count form click as confirmed lead, or checkout start as purchase. No guarantees of delivery at low bids. Do not infer email recipient attribution from list membership alone.
- Confirm both form links and language, mobile 390/desktop 1440, calculation without signup, no forced marketing or false success, opt-in pending until confirmed, unsubscribe and buyer suppression, email links, paid checkout + fulfillment, no duplicate sends, consent records.
- Verify sender authentication and actual email delivery to controlled seed addresses; do not send to real leads until QA and controller review. No new provider subscriptions or paid plan upgrades without approval.
- Record source SHA, deployment ID, CI and test evidence. No activation if form/workflow is missing, checkout is broken, or suppression cannot be validated. Mark unresolved gates explicitly.
