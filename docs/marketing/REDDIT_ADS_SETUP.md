# Reddit Ads setup — Human Design Mapa

## Co je připraveno v aplikaci

- landing page: `/cs/reddit-human-design` a `/en/reddit-human-design`,
- Reddit Pixel až po marketingovém souhlasu,
- SPA `PageVisit` a funnel eventy `ViewContent`, `AddToCart`, `Lead`, `Purchase`,
- uchování `rdt_cid` spolu s UTM parametry,
- Reddit Conversions API v3 pro serverově potvrzený nákup z Reddit návštěvy se souhlasem,
- deduplikace nákupu přes Stripe Checkout Session ID.

## Produkční proměnné

```env
VITE_REDDIT_PIXEL_ID=<pixel-id-z-events-manageru>
REDDIT_PIXEL_ID=<stejne-pixel-id-pro-server>
REDDIT_CONVERSION_TOKEN=<conversion-access-token>
```

Token patří pouze do Railway variables. Nikdy do `VITE_*`, klientského kódu nebo GitHubu.

## Doporučený první test

1. V Reddit Events Manageru vytvořit/zkopírovat Pixel ID a Conversion Access Token.
2. Nasadit proměnné a nový build.
3. Otevřít test URL:
   `https://www.humandesignmapa.cz/cs/reddit-human-design?utm_source=reddit&utm_medium=paid_social&utm_campaign=hdm_validation&utm_content=creative_a&rdt_cid=test`
4. Přijmout marketingové cookies a ověřit `PageVisit` a `ViewContent` v Events Manageru.
5. Provést testovací registraci a Stripe test nákup; ověřit `Lead` a deduplikovaný `PURCHASE`.

## První kampaň s malým rozpočtem

- Cíl první fáze: návštěvy/lead, ne rovnou předplatné bez dat.
- Jedna země a jeden jazyk na ad group.
- Tři kreativní úhly: „praktický experiment“, „typ a autorita“, „vztahová kompatibilita“.
- Každá reklama má vlastní `utm_content`; neměnit landing během testu.
- Po získání dostatečného počtu signupů přepnout optimalizaci na `SIGN_UP`, později na `PURCHASE`.
- Hodnotit podle celé cesty: landing view -> chart start -> signup -> první výklad -> pricing -> purchase.

Reddit od července 2026 vyžaduje conversion pixel pro ad groups/CBO. Vždy proto vybrat stejné Pixel ID, které používá aplikace.
