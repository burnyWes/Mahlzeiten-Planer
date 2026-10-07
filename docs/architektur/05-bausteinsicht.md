# 5 Bausteinsicht

Bausteinsicht des Mahlzeiten-Planers nach arc42, Kapitel 5. Die Diagramme sind in
Mermaid gezeichnet und spiegeln den Stand des Codes unter `src/` wider.

## 5.1 Ebene 1 – Whitebox Gesamtsystem

```mermaid
flowchart TB
    nutzer(["Haushalt<br/>(Browser / VoiceOver)"])

    subgraph pwa["Mahlzeiten-Planer (PWA)"]
        direction TB
        root["Kompositionswurzel<br/>main.tsx · App.tsx · SignedInApp.tsx"]

        subgraph kontexte["Fachliche Kontexte"]
            direction LR
            shopping["<b>shopping</b><br/>Einkaufsliste, bekannte Artikel,<br/>bekannte Einheiten"]
            meals["<b>meals</b><br/>Gerichte, Kategorien,<br/>Wochenplan, Vorräte"]
        end

        shared["<b>shared</b><br/>auth · appearance · appUpdate<br/>domain · ui"]
    end

    subgraph extern["Fremdsysteme"]
        direction LR
        fbauth[("Firebase Auth")]
        firestore[("Cloud Firestore<br/>offline-first")]
        sw[["Service Worker<br/>vite-plugin-pwa"]]
        ls[("localStorage")]
    end

    nutzer --> root
    root --> shopping
    root --> meals
    root --> shared
    shopping --> shared
    meals --> shared

    shopping -. Adapter .-> firestore
    meals -. Adapter .-> firestore
    shared -. Adapter .-> fbauth
    shared -. Adapter .-> sw
    shared -. Adapter .-> ls
```

`shopping` und `meals` kennen einander nicht. Die einzige Verbindung – Gerichte und
Wochenplan auf die Einkaufsliste übertragen – stellt die Kompositionswurzel in
`SignedInApp.tsx` her.

### Enthaltene Bausteine

| Baustein | Verantwortung |
| --- | --- |
| **Kompositionswurzel** | `main.tsx` erzeugt die echten Adapter (Firestore, Firebase Auth, Service Worker, localStorage) und reicht sie an `App` durch. `App` regelt Anmeldung, Darstellung und App-Update. `SignedInApp` setzt die Bereiche zusammen, steuert die Navigation und übersetzt zwischen `meals` und `shopping`. |
| **shopping** | Die gemeinsame Einkaufsliste: Artikel anlegen, Menge ändern, abhaken, aufräumen. Pflegt die bekannten Artikel und Einheiten für Vorschläge beim Tippen. |
| **meals** | Die Gerichte des Haushalts mit Kategorien und Kennzeichnungen, der Wochenplan samt Zufallsauswahl und Regeln sowie die Vorräte. |
| **shared** | Kontextübergreifendes: Anmeldung, Darstellung (Farbumkehr), App-Update, gemeinsame Domänenwerte (`Quantity`, `Clock`) und Bedienelemente für Navigation, Fokus und Ansagen. |

### Schnittstellen nach außen

| Fremdsystem | Genutzt von | Zweck |
| --- | --- | --- |
| Cloud Firestore | `shopping`, `meals` | Gemeinsamer Datenbestand des Haushalts, offline-first synchronisiert. |
| Firebase Auth | `shared/auth` | Ein gemeinsames Konto für den Haushalt. |
| Service Worker | `shared/appUpdate` | Offline-Betrieb und Angebot neuer Versionen. |
| localStorage | `shared/appearance` | Gerätelokale Darstellungseinstellung. |

## 5.2 Ebene 2 – Whitebox eines fachlichen Kontexts

Beide Kontexte sind gleich geschnitten. Die Abhängigkeiten zeigen nach innen zur Domäne.

```mermaid
flowchart TB
    subgraph kontext["Fachlicher Kontext (shopping | meals)"]
        direction TB
        ui["<b>ui</b><br/>Areas · Pages · Rows<br/>Hooks: use…"]

        subgraph api["api"]
            direction LR
            port["<b>Port</b><br/>…Client (Interface)"]
            fsAdapter["<b>Adapter</b><br/>firestore…Client"]
            memAdapter["<b>Fake</b><br/>inMemory…Client"]
        end

        domain["<b>domain</b><br/>Entitäten, Wertobjekte,<br/>reine Fachfunktionen"]
    end

    sharedDomain["shared/domain<br/>Quantity · Clock"]
    sharedUi["shared/ui<br/>BottomBar · Stepper · Fokus · Ansagen"]
    firestore[("Cloud Firestore")]

    ui --> port
    ui --> domain
    ui --> sharedUi
    fsAdapter -. implementiert .-> port
    memAdapter -. implementiert .-> port
    port --> domain
    fsAdapter --> domain
    fsAdapter --> firestore
    domain --> sharedDomain
```

| Schicht | Verantwortung | Regeln |
| --- | --- | --- |
| **domain** | Fachliche Typen und Regeln als reine Funktionen. | Kennt weder React noch Firebase. Test-getrieben, ohne Framework. |
| **api** | Port als `…Client`-Interface, dazu der Firestore-Adapter für den Betrieb und der In-Memory-Fake für Tests. | Adapter übersetzen zwischen Firestore-Dokumenten und Domänentypen. |
| **ui** | React-Komponenten und Hooks. Die Hooks halten den Zustand, sprechen den Port an und rufen die Domäne. | Kennt nur den Port, nie den Firestore-Adapter. |

## 5.3 Ebene 2 – Whitebox shopping

```mermaid
flowchart TB
    subgraph ui["ui"]
        direction LR
        shoppingArea["ShoppingArea<br/>ShoppingListPage · AddItemPage · RemoveItemPage"]
        knownItemsArea["KnownItemsArea<br/>KnownItemListPage · KnownItemFormPage"]
        knownUnitsArea["KnownUnitsArea<br/>KnownUnitListPage · KnownUnitFormPage"]
        hooks["useShoppingList · useKnownItems · useKnownUnits"]
    end

    subgraph api["api"]
        direction LR
        shoppingListClient["ShoppingListClient"]
        knownItemsClient["KnownItemsClient"]
        knownUnitsClient["KnownUnitsClient"]
    end

    subgraph domain["domain"]
        direction LR
        shoppingItem["shoppingItem<br/>addition"]
        knownItem["knownItem"]
        knownUnit["knownUnit"]
        support["stableList · unconfirmedWrites<br/>announcements"]
    end

    shoppingArea --> hooks
    knownItemsArea --> hooks
    knownUnitsArea --> hooks
    hooks --> shoppingListClient
    hooks --> knownItemsClient
    hooks --> knownUnitsClient
    hooks --> domain
    shoppingListClient --> shoppingItem
    knownItemsClient --> knownItem
    knownUnitsClient --> knownUnit

    shoppingListClient -.-> items[("items")]
    knownItemsClient -.-> knownItems[("knownItems")]
    knownUnitsClient -.-> knownUnits[("units")]
```

## 5.4 Ebene 2 – Whitebox meals

```mermaid
flowchart TB
    subgraph ui["ui"]
        direction LR
        mealsArea["MealsArea<br/>MealListPage · MealPage · MealFormPage"]
        categoriesArea["CategoriesArea<br/>CategoryListPage · CategoryFormPage"]
        weekPlanArea["WeekPlanArea<br/>WeekPlanPage · PeriodPage"]
        suppliesArea["SuppliesArea<br/>SupplyListPage · SupplyPage"]
        hooks["useMeals · useWeekPlan · useSupplies"]
    end

    subgraph api["api"]
        direction LR
        mealsClient["MealsClient"]
        weekPlanClient["WeekPlanClient"]
        suppliesClient["SuppliesClient"]
    end

    subgraph domain["domain"]
        direction LR
        meal["meal · mealCategory<br/>mealFilter · mealSuggestions"]
        weekPlan["weekPlan · weekPlanStage<br/>weekPlanView · randomPlanning<br/>leftovers · planDate · planPeriod"]
        supply["supply · unconfirmedSupplies"]
        support["text · unconfirmedWrite<br/>announcements"]
    end

    mealsArea --> hooks
    categoriesArea --> hooks
    weekPlanArea --> hooks
    suppliesArea --> hooks
    hooks --> mealsClient
    hooks --> weekPlanClient
    hooks --> suppliesClient
    hooks --> domain
    mealsClient --> meal
    weekPlanClient --> weekPlan
    suppliesClient --> supply

    mealsClient -.-> meals[("meals")]
    weekPlanClient -.-> weekPlanDocs[("weekPlan")]
    suppliesClient -.-> supplies[("supplies")]
```

## 5.5 Ebene 2 – Whitebox shared

```mermaid
flowchart LR
    subgraph shared["shared"]
        direction TB
        auth["<b>auth</b><br/>AuthClient · useSession · SignInPage<br/>firebaseAuthClient · inMemoryAuthClient"]
        appearance["<b>appearance</b><br/>AppearanceClient · useAppearance<br/>localStorageAppearanceClient"]
        appUpdate["<b>appUpdate</b><br/>AppUpdateClient · useAppUpdate · AppUpdateOffer<br/>serviceWorkerAppUpdateClient"]
        sdomain["<b>domain</b><br/>quantity · clock"]
        sui["<b>ui</b><br/>NavigationBar · BottomBar · SettingsPage<br/>Announcer · Stepper · NameSuggestions<br/>useHeadingFocus · useFocusAfterRemoval"]
    end

    auth -.-> fbauth[("Firebase Auth")]
    appearance -.-> ls[("localStorage")]
    appUpdate -.-> sw[["Service Worker"]]
```

`shared` hängt von keinem fachlichen Kontext ab. Auch hier liegen Port, echter Adapter
und In-Memory-Fake jeweils zusammen in einem Ordner.
