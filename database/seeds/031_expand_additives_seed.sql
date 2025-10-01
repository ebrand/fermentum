-- 031_expand_additives_seed.sql
-- Expanded seed data for brewing additives across 5 categories
-- Categories: Water Treatment, Clarification, Enzymes, Antioxidants, Stabilizers

BEGIN;

-- Clear existing additives to avoid duplicates
DELETE FROM "Additive" WHERE "TenantId" IS NULL;

-- WATER TREATMENT ADDITIVES
INSERT INTO "Additive" (
    "TenantId", "Name", "Category", "Type", "DosageMin", "DosageMax", "DosageUnit",
    "Description", "Usage", "SafetyNotes", "Purpose", "IsActive", "IsCustom"
) VALUES

-- Brewing Salts
(NULL, 'Gypsum (Calcium Sulfate)', 'Water Treatment', 'Mineral Salt', 0.5, 5.0, 'g/L',
 'Adds calcium and sulfate ions to brewing water. Enhances hop character and lowers mash pH.',
 'Add to mash or brewing water. 1g/gal adds 62ppm calcium, 147ppm sulfate.',
 'Food grade. Avoid inhaling powder.',
 'Various', true, false),

(NULL, 'Calcium Chloride', 'Water Treatment', 'Mineral Salt', 0.5, 3.0, 'g/L',
 'Adds calcium and chloride ions. Enhances malt character and lowers mash pH.',
 'Add to mash or brewing water. 1g/gal adds 72ppm calcium, 127ppm chloride.',
 'Food grade. Handle with care.',
 'Various', true, false),

(NULL, 'Epsom Salt (Magnesium Sulfate)', 'Water Treatment', 'Mineral Salt', 0.1, 1.0, 'g/L',
 'Adds magnesium and sulfate ions. Essential nutrient for yeast health.',
 'Add to brewing water. Use sparingly as magnesium can create bitter/astringent flavors.',
 'Food grade. Bitter taste in high concentrations.',
 'Various', true, false),

(NULL, 'Table Salt (Sodium Chloride)', 'Water Treatment', 'Mineral Salt', 0.1, 0.5, 'g/L',
 'Adds sodium and chloride ions. Enhances malt sweetness in small amounts.',
 'Use very sparingly. Small amounts enhance malt character.',
 'Food grade. High concentrations can create metallic flavors.',
 'Various', true, false),

-- pH Adjustment
(NULL, 'Lactic Acid (88%)', 'Water Treatment', 'Acid', 0.1, 2.0, 'mL/L',
 'Food grade acid for mash pH adjustment. Smooth, clean acid profile.',
 'Add to mash to lower pH. Start with small amounts and test.',
 'Corrosive. Wear gloves and eye protection.',
 'Various', true, false),

(NULL, 'Phosphoric Acid (10%)', 'Water Treatment', 'Acid', 0.1, 1.5, 'mL/L',
 'Food grade acid for pH adjustment. Neutral flavor profile.',
 'Add to mash water before heating. More neutral than lactic acid.',
 'Corrosive even when diluted. Handle with care.',
 'Various', true, false),

-- Dechlorination
(NULL, 'Sodium Metabisulfite (Campden Tablets)', 'Water Treatment', 'Dechlorinator', 0.1, 0.3, 'g/L',
 'Removes chlorine and chloramine from brewing water. Also acts as antioxidant.',
 'Crush tablet and add to water 30 minutes before use. 1 tablet per 20L.',
 'Food grade. May cause allergic reactions in sensitive individuals.',
 'Various', true, false),

-- CLARIFICATION AGENTS
(NULL, 'PVPP (Polyvinylpolypyrrolidone)', 'Clarification', 'Polyphenol Adsorbent', 0.1, 1.0, 'g/L',
 'Removes polyphenols responsible for chill haze. Brand names include Polyclar.',
 'Add after fermentation. Mix gently and allow to settle before racking.',
 'Non-toxic plastic particulate. Food grade only.',
 'Ashland (Polyclar)', true, false),

(NULL, 'Silica Gel', 'Clarification', 'Protein Adsorbent', 0.5, 2.0, 'g/L',
 'Removes haze-sensitive proteins. Brand names include Kieselsol, ChillGuard.',
 'Add after fermentation. Works synergistically with PVPP and isinglass.',
 'Food grade silica only. Non-toxic.',
 'Grace (DARACLAR)', true, false),

(NULL, 'Isinglass', 'Clarification', 'Finings', 0.1, 0.5, 'g/L',
 'Traditional finings from fish swim bladders. Removes yeast and protein particles.',
 'Add after fermentation is complete. Mix gently to avoid breaking flocs.',
 'Not suitable for vegetarian/vegan beers. May cause allergic reactions.',
 'Lallemand (Cryofine)', true, false),

(NULL, 'Gelatin', 'Clarification', 'Finings', 0.5, 2.0, 'g/L',
 'Protein-based clarifying agent. Effective for removing tannins and haze.',
 'Dissolve in warm water, cool, then add to beer. Cold crash recommended.',
 'Not suitable for vegetarian/vegan beers.',
 'Various', true, false),

(NULL, 'Irish Moss (Carrageenan)', 'Clarification', 'Kettle Finings', 0.5, 1.0, 'g/L',
 'Seaweed extract that aids protein coagulation during boil.',
 'Add to kettle 15 minutes before end of boil. Aids hot break formation.',
 'Natural product. Generally recognized as safe.',
 'Various', true, false),

(NULL, 'Whirlfloc Tablets', 'Clarification', 'Kettle Finings', 0.5, 1.0, 'tablet/19L',
 'Refined carrageenan in convenient tablet form. More effective than Irish moss.',
 'Add 1 tablet per 5 gallons with 15 minutes left in boil.',
 'Natural seaweed extract. Very effective kettle finings.',
 'Various', true, false),

-- ENZYMES
(NULL, 'Alpha Amylase', 'Enzymes', 'Starch Converting', 0.1, 0.5, 'mL/L',
 'Breaks down starches to fermentable sugars. Increases attenuation.',
 'Add to mash or during fermentation. Active at mash temperatures.',
 'Food grade enzyme. Follow manufacturer dosage recommendations.',
 'Novozymes', true, false),

(NULL, 'Glucoamylase (AMG)', 'Enzymes', 'Starch Converting', 0.1, 0.3, 'mL/L',
 'Converts dextrins to fermentable glucose. Highly attenuating.',
 'Add during fermentation for dry beers. Very effective at reducing FG.',
 'Food grade enzyme. Can create very dry beers if overdosed.',
 'Novozymes', true, false),

(NULL, 'Beta Glucanase', 'Enzymes', 'Cell Wall', 0.1, 0.2, 'mL/L',
 'Breaks down beta glucans that can cause stuck mashes and haze.',
 'Add to mash when using high proportions of wheat, oats, or barley.',
 'Food grade enzyme. Particularly useful for wheat beers.',
 'Novozymes', true, false),

(NULL, 'Pectinase', 'Enzymes', 'Clarifying', 0.1, 0.5, 'mL/L',
 'Breaks down pectin haze, especially important for fruit beers.',
 'Add when using fruit additions. Helps prevent pectin haze.',
 'Food grade enzyme. Essential for clear fruit beers.',
 'Various', true, false),

(NULL, 'Fungamyl (Maltogenic Amylase)', 'Enzymes', 'Anti-Staling', 0.05, 0.2, 'mL/L',
 'Novozymes enzyme that prevents starch retrogradation and extends shelf life.',
 'Add during mash or fermentation. Helps maintain beer freshness.',
 'Food grade enzyme. Commercial anti-staling enzyme.',
 'Novozymes', true, false),

-- ANTIOXIDANTS
(NULL, 'Ascorbic Acid (Vitamin C)', 'Antioxidants', 'Oxygen Scavenger', 0.1, 0.5, 'g/L',
 'Powerful antioxidant that prevents oxidation and staling flavors.',
 'Add at packaging. Use 1 tsp per 5 gallons. Dissolve in small amount of water first.',
 'Food grade. High doses can affect flavor.',
 'Various', true, false),

(NULL, 'Sodium Metabisulfite', 'Antioxidants', 'Sulfite Antioxidant', 0.05, 0.2, 'g/L',
 'Dual purpose: removes chlorine and acts as antioxidant.',
 'Add to water or at packaging. Effective against oxidation.',
 'May cause allergic reactions. Declare on labels if required.',
 'Various', true, false),

(NULL, 'Brewtan B', 'Antioxidants', 'Tannin Antioxidant', 0.1, 0.3, 'g/L',
 'Natural tannin-based antioxidant. Very effective at preventing oxidation.',
 'Add at end of fermentation or packaging. Highly effective antioxidant.',
 'Natural gallotannin extract. Very potent antioxidant.',
 'Laffort', true, false),

(NULL, 'Erythorbic Acid', 'Antioxidants', 'Oxygen Scavenger', 0.1, 0.4, 'g/L',
 'Stereoisomer of ascorbic acid. Effective antioxidant with neutral flavor.',
 'Add at packaging. Similar effectiveness to ascorbic acid.',
 'Food grade. More stable than ascorbic acid.',
 'Various', true, false),

-- STABILIZERS
(NULL, 'Potassium Sorbate', 'Stabilizers', 'Antimicrobial', 0.1, 0.3, 'g/L',
 'Prevents refermentation and microbial spoilage. Used in sweet beers.',
 'Add after fermentation is complete. Effective against yeast and bacteria.',
 'Food grade preservative. May affect flavor in high concentrations.',
 'Various', true, false),

(NULL, 'Sodium Benzoate', 'Stabilizers', 'Antimicrobial', 0.05, 0.15, 'g/L',
 'Antimicrobial preservative. Effective against bacteria and wild yeast.',
 'Add after fermentation. More effective at lower pH.',
 'Food grade preservative. Check local regulations for usage limits.',
 'Various', true, false),

(NULL, 'Potassium Metabisulfite', 'Stabilizers', 'Antimicrobial/Antioxidant', 0.05, 0.2, 'g/L',
 'Dual purpose antimicrobial and antioxidant. Similar to sodium metabisulfite.',
 'Add after fermentation or at packaging. Effective preservative.',
 'May cause allergic reactions. Preferred over sodium form in some applications.',
 'Various', true, false),

(NULL, 'DMDC (Dimethyl Dicarbonate)', 'Stabilizers', 'Cold Sterilant', 0.2, 0.25, 'mL/L',
 'Commercial cold sterilization agent. Rapidly hydrolyzes to CO2 and methanol.',
 'Industrial use only. Requires special handling and equipment.',
 'Highly toxic in concentrated form. Professional use only.',
 'Lanxess (Velcorin)', true, false);

-- Update created/updated timestamps
UPDATE "Additive"
SET "Created" = CURRENT_TIMESTAMP, "Updated" = CURRENT_TIMESTAMP
WHERE "TenantId" IS NULL;

COMMIT;

-- Summary of additions:
-- Water Treatment: 7 additives (salts, acids, dechlorinators)
-- Clarification: 6 additives (PVPP, silica gel, isinglass, gelatin, Irish moss, Whirlfloc)
-- Enzymes: 5 additives (amylases, glucanase, pectinase, anti-staling)
-- Antioxidants: 4 additives (ascorbic acid, metabisulfites, Brewtan B, erythorbic acid)
-- Stabilizers: 4 additives (sorbate, benzoate, metabisulfite, DMDC)
-- Total: 26 professional brewing additives across 5 categories