# Finland Tracker - Projektin ohjeet agentille

## Repo & Ympäristö

- **Repo:** `tuomasmonni/finland-tracker`
- **Remote:** `git@github.com:tuomasmonni/finland-tracker.git`
- **Tuotanto:** https://tilannekuva.online (Vercel, auto-deploy mainista)
- **Vercel-projekti:** finland-tracker-v1 (tmo-8c3e6ad2)
- **Lokaali kehitys:** Ei toimi ilman `.env.local` (Mapbox-token puuttuu). Käytä Vercel Preview -brancheja testaukseen.

## Aktiivinen kehitysbranch

- **Branch:** `feature/new-layers`
- **Preview:** https://finland-tracker-v1-git-feature-new-layers-tmo-8c3e6ad2.vercel.app
- **Sisältö:** Uudet karttatasot (sää, joukkoliikenne, tiesää, liikenne)
- **Tila:** Kehityksessä, EI testattu, EI tuotantovalmis

**TÄRKEÄÄ:** Kaikki uusi kehitystyö tehdään tähän branchiin tai siitä haarautuviin feature-brancheihin. Mainiin EI commitoida suoraan.

## DEPLOY-SÄÄNNÖT (PAKOLLINEN)

**ÄLÄ KOSKAAN pushaa suoraan mainiin. Noudata AINA tätä työnkulkua:**

### Työnkulku

```
1. Luo feature-branch mainista
2. Commitoi VAIN kyseiseen ominaisuuteen liittyvät muutokset
3. Push feature-branch → Vercel luo automaattisesti preview-linkin
4. Anna preview-linkki käyttäjälle testattavaksi
5. ODOTA käyttäjän hyväksyntä
6. Käyttäjän hyväksyttyä → listaa TARKASTI mitä menee tuotantoon
7. ODOTA käyttäjän vahvistus listaukselle
8. Vasta sitten: merge mainiin + push
```

### Ehdottomat säännöt

1. **Yksi ominaisuus per branch.** Älä niputa useita ominaisuuksia samaan committiin.
2. **Stashaa ylimääräiset.** Jos working treessä on muutoksia jotka EIVÄT liity käsiteltävään ominaisuuteen → `git stash` ENNEN commitointia.
3. **Listaa aina ennen pushia mainiin:**
   ```
   TUOTANTOON MENEE:
   - [commit-viesti]
   - Tiedostot: [tiedosto1, tiedosto2]
   - Ominaisuus: [lyhyt kuvaus]

   EI MENE TUOTANTOON:
   - [lokaalit muutokset X, Y, Z]
   ```
4. **Testaamaton koodi EI KOSKAAN tuotantoon.** Jokainen ominaisuus testataan preview-branchissa ennen mergea.
5. **Älä oleta.** Jos käyttäjä sanoo "laita tuotantoon", varmista silti MITÄ laitetaan.

### Feature-branch nimeäminen

```
feature/[lyhyt-kuvaus]    esim. feature/accordion-sections
fix/[bugin-kuvaus]        esim. fix/crime-calculation
```

### Preview-linkin muoto

```
https://finland-tracker-v1-git-[branch-nimi]-tmo-8c3e6ad2.vercel.app
```

### Merge-prosessi (kun käyttäjä hyväksynyt)

```bash
git stash                    # Piilota lokaalit muutokset
git checkout main
git merge feature/x --no-ff  # Merge-commit
git push origin main         # Tuotantoon
git stash pop                # Palauta lokaalit muutokset
```

Jos stash pop aiheuttaa konfliktin → ratkaise niin että lokaalit kehitysmuutokset säilyvät ja tuotantomuutokset ovat mukana.

## Tekniset muistiinpanot

- **Väkilukudata:** Tilastokeskus, "Väestö 31.12." joka vuodelle. Varmistettu oikeaksi.
- **Rikosdata:** Tilastokeskus ICCS-luokitus (`statfin_rpk_pxt_13kq.px`). Varmistettu oikeaksi.
- **Per 100k laskukaava:** `(totalCrimes / population) * 100000`
- **Staattinen data:** `data/static/crime-statistics.json` - ei API-kutsuja runtimessa
