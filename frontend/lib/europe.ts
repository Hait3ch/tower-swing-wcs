/**
 * Countries the partner queue cares about. "Europe" is a deliberate product
 * choice: Russia (RUS) and Turkey (TUR) are excluded.
 */
export const EUROPE_ISO3: ReadonlySet<string> = new Set([
  "ALB", "AND", "AUT", "BEL", "BIH", "BGR", "BLR", "CHE", "CYP", "CZE", "DEU", "DNK", "ESP",
  "EST", "FIN", "FRA", "GBR", "GRC", "HRV", "HUN", "IRL", "ISL", "ITA", "LIE", "LTU", "LUX",
  "LVA", "MCO", "MDA", "MKD", "MLT", "MNE", "NLD", "NOR", "POL", "PRT", "ROU", "SMR", "SRB",
  "SVK", "SVN", "SWE", "UKR",
]);

/** iso3 → [iso2, English name]. Covers Europe plus every non-European country seen on the WSDC page. */
const COUNTRIES: Record<string, [string, string]> = {
  ALB: ["AL", "Albania"], AND: ["AD", "Andorra"], AUT: ["AT", "Austria"], BEL: ["BE", "Belgium"],
  BIH: ["BA", "Bosnia and Herzegovina"], BGR: ["BG", "Bulgaria"], BLR: ["BY", "Belarus"],
  CHE: ["CH", "Switzerland"], CYP: ["CY", "Cyprus"], CZE: ["CZ", "Czech Republic"],
  DEU: ["DE", "Germany"], DNK: ["DK", "Denmark"], ESP: ["ES", "Spain"], EST: ["EE", "Estonia"],
  FIN: ["FI", "Finland"], FRA: ["FR", "France"], GBR: ["GB", "United Kingdom"],
  GRC: ["GR", "Greece"], HRV: ["HR", "Croatia"], HUN: ["HU", "Hungary"], IRL: ["IE", "Ireland"],
  ISL: ["IS", "Iceland"], ITA: ["IT", "Italy"], LIE: ["LI", "Liechtenstein"],
  LTU: ["LT", "Lithuania"], LUX: ["LU", "Luxembourg"], LVA: ["LV", "Latvia"],
  MCO: ["MC", "Monaco"], MDA: ["MD", "Moldova"], MKD: ["MK", "North Macedonia"],
  MLT: ["MT", "Malta"], MNE: ["ME", "Montenegro"], NLD: ["NL", "Netherlands"],
  NOR: ["NO", "Norway"], POL: ["PL", "Poland"], PRT: ["PT", "Portugal"], ROU: ["RO", "Romania"],
  SMR: ["SM", "San Marino"], SRB: ["RS", "Serbia"], SVK: ["SK", "Slovakia"],
  SVN: ["SI", "Slovenia"], SWE: ["SE", "Sweden"], UKR: ["UA", "Ukraine"],
  // outside the European set
  RUS: ["RU", "Russia"], TUR: ["TR", "Turkey"], USA: ["US", "United States"],
  CAN: ["CA", "Canada"], AUS: ["AU", "Australia"], NZL: ["NZ", "New Zealand"],
  SGP: ["SG", "Singapore"], KOR: ["KR", "South Korea"], BRA: ["BR", "Brazil"],
  JPN: ["JP", "Japan"], CHN: ["CN", "China"], ISR: ["IL", "Israel"], MEX: ["MX", "Mexico"],
};

/** Lower-cased country names (English + native spellings used on WSDC) → iso3. */
const NAME_ALIASES: Record<string, string> = {
  us: "USA", usa: "USA", "united states of america": "USA", america: "USA",
  uk: "GBR", england: "GBR", scotland: "GBR", wales: "GBR", "great britain": "GBR",
  deutschland: "DEU", nederland: "NLD", holland: "NLD", "the netherlands": "NLD",
  "españa": "ESP", espana: "ESP", italia: "ITA", polska: "POL", sverige: "SWE", norge: "NOR",
  suomi: "FIN", danmark: "DNK", "česko": "CZE", czechia: "CZE", "česká republika": "CZE",
  schweiz: "CHE", suisse: "CHE", svizzera: "CHE", "österreich": "AUT", "magyarország": "HUN",
  "россия": "RUS", "türkiye": "TUR", "belgië": "BEL", belgique: "BEL", eesti: "EST",
  hrvatska: "HRV", "slovensko": "SVK", slovenija: "SVN", "ελλάδα": "GRC", "românia": "ROU",
  "україна": "UKR", lietuva: "LTU", latvija: "LVA", "ísland": "ISL", "éire": "IRL",
  "korea": "KOR", "republic of korea": "KOR",
};

for (const [iso3, [, name]] of Object.entries(COUNTRIES)) NAME_ALIASES[name.toLowerCase()] = iso3;

export function countryNameToIso3(name: string): string | null {
  return NAME_ALIASES[name.trim().toLowerCase()] ?? null;
}

export function iso3ToName(code: string): string {
  return COUNTRIES[code]?.[1] ?? code;
}

/** Flag emoji from regional indicator symbols; "" when the country is unknown. */
export function iso3ToFlag(code: string | null | undefined): string {
  const iso2 = code ? COUNTRIES[code]?.[0] : undefined;
  if (!iso2) return "";
  return String.fromCodePoint(...[...iso2].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** European countries sorted by name, for select inputs. */
export const EUROPE_OPTIONS: ReadonlyArray<{ code: string; name: string }> = [...EUROPE_ISO3]
  .map((code) => ({ code, name: iso3ToName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));
