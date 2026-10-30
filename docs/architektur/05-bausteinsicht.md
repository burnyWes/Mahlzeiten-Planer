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
            shopping["<b>shopping</b><br/>Einkaufsliste, bekannte Artikel,<br/>Artikelkategorien, bekannte Einheiten"]
            meals["<b>meals</b><br/>Gerichte, Kategorien-Katalog,<br/>Wochenplan, Vorräte"]
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

`shopping` und `meals` kennen einander nicht. Alle Verbindungen stellt die
Kompositionswurzel in `SignedInApp.tsx` her: Sie überträgt Gerichte und Wochenplan auf
die Einkaufsliste, reicht der Artikelverwaltung die Gerichte je Artikel als fertige
Sicht (`MealUsingItem`) und zieht das Entfernen und Umbenennen von Artikeln in den
Gerichten nach.

### Enthaltene Bausteine

| Baustein | Verantwortung |
| --- | --- |
| **Kompositionswurzel** | `main.tsx` erzeugt die echten Adapter (Firestore, Firebase Auth, Service Worker, localStorage) und reicht sie an `App` durch. `App` regelt Anmeldung, Darstellung und App-Update. `SignedInApp` setzt die Bereiche zusammen, steuert die Navigation und übersetzt zwischen `meals` und `shopping`. |
| **shopping** | Die gemeinsame Einkaufsliste: Artikel anlegen, Menge ändern, abhaken, aufräumen, nach Ladenreihenfolge gruppieren. Pflegt die bekannten Artikel samt Artikelkategorie, die Artikelkategorien in ihrer Reihenfolge und die Einheiten für Vorschläge beim Tippen. |
| **meals** | Die Gerichte des Haushalts mit Kategorien (samt eigenem Katalog, damit leere Kategorien bestehen bleiben) und Kennzeichnungen, der Wochenplan samt Zufallsauswahl und Regeln sowie die Vorräte. |
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

    sharedDomain["shared/domain<br/>Quantity · Clock · unconfirmedWrite"]
    sharedUi["shared/ui<br/>BottomBar · ManagementHeader · Stepper · SpinButton · AmountSpinner · Fokus · Ansagen"]
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
        shoppingArea["ShoppingArea<br/>ShoppingListPage · AddItemPage<br/>ChooseItemCategoryPage · RemoveItemPage"]
        knownItemsArea["KnownItemsArea<br/>KnownItemListPage · KnownItemFormPage"]
        itemCategoriesArea["ItemCategoriesArea<br/>ItemCategoryListPage · ItemCategoryFormPage"]
        knownUnitsArea["KnownUnitsArea<br/>KnownUnitListPage · KnownUnitFormPage"]
        hooks["useShoppingList · useKnownItems<br/>useItemCategories · useKnownUnits"]
    end

    subgraph api["api"]
        direction LR
        shoppingListClient["ShoppingListClient"]
        knownItemsClient["KnownItemsClient"]
        itemCategoriesClient["ItemCategoriesClient"]
        knownUnitsClient["KnownUnitsClient"]
    end

    subgraph domain["domain"]
        direction LR
        shoppingItem["shoppingItem<br/>addition"]
        knownItem["catalogEntry · knownItem"]
        itemCategory["itemCategory"]
        knownUnit["knownUnit"]
        support["stableList · categorizedList<br/>unconfirmedWrites · announcements"]
    end

    shoppingArea --> hooks
    knownItemsArea --> hooks
    itemCategoriesArea --> hooks
    knownUnitsArea --> hooks
    hooks --> shoppingListClient
    hooks --> knownItemsClient
    hooks --> itemCategoriesClient
    hooks --> knownUnitsClient
    hooks --> domain
    shoppingListClient --> shoppingItem
    knownItemsClient --> knownItem
    itemCategoriesClient --> itemCategory
    knownUnitsClient --> knownUnit

    shoppingListClient -.-> items[("items")]
    knownItemsClient -.-> knownItems[("knownItems")]
    itemCategoriesClient -.-> itemCategories[("itemCategories")]
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
        hooks["useMeals · useMealCategories<br/>useWeekPlan · useSupplies"]
    end

    subgraph api["api"]
        direction LR
        mealsClient["MealsClient"]
        mealCategoriesClient["MealCategoriesClient"]
        weekPlanClient["WeekPlanClient"]
        suppliesClient["SuppliesClient"]
    end

    subgraph domain["domain"]
        direction LR
        meal["meal · mealCategory<br/>mealFilter · mealSuggestions"]
        weekPlan["weekPlan · weekPlanStage<br/>weekPlanView · randomPlanning<br/>rollingRules · rollMemory · leftovers<br/>planDate · planPeriod"]
        supply["supply · unconfirmedSupplies"]
        support["text · announcements"]
    end

    mealsArea --> hooks
    categoriesArea --> hooks
    weekPlanArea --> hooks
    suppliesArea --> hooks
    hooks --> mealsClient
    hooks --> mealCategoriesClient
    hooks --> weekPlanClient
    hooks --> suppliesClient
    hooks --> domain
    mealsClient --> meal
    mealCategoriesClient --> meal
    weekPlanClient --> weekPlan
    suppliesClient --> supply

    mealsClient -.-> meals[("meals")]
    mealCategoriesClient -.-> mealCategoriesDocs[("mealCategories")]
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
        sdomain["<b>domain</b><br/>quantity · clock · unconfirmedWrite"]
        sui["<b>ui</b><br/>NavigationBar · BottomBar · SettingsPage · ManagementHeader<br/>Announcer · Stepper · SpinButton · SpinArrow · AmountSpinner · NameSuggestions<br/>useHeadingFocus · useFocusAfterRemoval"]
    end

    auth -.-> fbauth[("Firebase Auth")]
    appearance -.-> ls[("localStorage")]
    appUpdate -.-> sw[["Service Worker"]]
```

`shared` hängt von keinem fachlichen Kontext ab. Auch hier liegen Port, echter Adapter
und In-Memory-Fake jeweils zusammen in einem Ordner.
