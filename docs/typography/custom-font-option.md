# Custom Font Creation Option: "Crystalline"

## Why Create a Custom Font?

**Uniqueness**: Unreplicatable brand identity
**Perfect Fit**: Designed specifically for geological/mineralogical context
**Control**: Own the IP, no licensing fees
**Performance**: Optimized for exact use case

## Design Brief for Custom Typeface

### Name: **Crystalline Display**

A geometric serif display typeface inspired by:
- Crystal lattice structures and facets
- Swiss precision instruments
- Vintage geological survey typography
- Mountain peak silhouettes

### Character Design Principles

**Letterforms**:
- **Serifs**: Sharp, faceted (like crystal terminations)
- **Bowls**: Slightly hexagonal (references hexagonal crystal system)
- **Stems**: Strong vertical emphasis (mountain peaks)
- **Counters**: Geometric, precise
- **Terminals**: Angled cuts (cleavage planes)

**Inspired by**:
- Basalt columns (angular geometry)
- Quartz crystal faces (planar surfaces)
- Geological cross-sections (stratification)
- Mineral specimen labels (precision)

### Glyph Set

**Essentials**:
- A-Z, a-z (Latin basic)
- 0-9 (tabular and proportional)
- Punctuation and symbols
- Accented characters (European coverage)

**Special Glyphs**:
- Scientific symbols: °, ′, ″ (degrees, minutes, seconds)
- Math operators: ×, ÷, ±, ≈
- Fractions: ½, ⅓, ¼
- Arrows: ←, →, ↔
- Miller indices brackets: {}, [], ()

### Weights & Styles

**Phase 1** (Display only):
- Regular (600 equivalent)
- Bold (700 equivalent)

**Phase 2** (Extended family):
- Light (300)
- Medium (500)
- Italic variants

### OpenType Features

```
liga - Standard ligatures (fi, fl)
dlig - Discretionary ligatures (ct, st)
salt - Stylistic alternates (geometric vs. humanist)
ss01 - Sharper serifs (default)
ss02 - Softer serifs (optional)
ss03 - Rounded terminals (for warmer feel)
tnum - Tabular numbers (data tables)
pnum - Proportional numbers (body text)
frac - Automatic fractions
sups - Superscript (chemical formulas)
subs - Subscript
```

### Character Showcase

```
                 CRYSTALLINE
         A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
         a b c d e f g h i j k l m n o p q r s t u v w x y z
              0 1 2 3 4 5 6 7 8 9
           { 1 0 0 } [ m 3 m ] ( 1 1 1 )

         ◆  Faceted Serifs  ◆  Geometric Precision  ◆
```

**Key letterforms to perfect**:
- **G**: Angular terminal suggesting crystal cleavage
- **M/W**: Mountain peak silhouettes
- **O/Q**: Slightly hexagonal (not circular)
- **R**: Angled leg suggesting geological strata
- **S**: Asymmetric curves (crystal asymmetry)
- **{}/[]**: Wider, more geometric (Miller indices)

### Production Timeline

**Weeks 1-2**: Concept sketches, key glyphs (H, O, n, o)
**Weeks 3-4**: Complete alphabet, test words
**Weeks 5-6**: Numbers, punctuation, spacing
**Weeks 7-8**: Kerning, OpenType features
**Weeks 9-10**: Testing, refinement, web font generation

**Total**: 10-12 weeks for professional result

## Outsourcing Options

### Option A: Commission Professional Type Designer
**Cost**: $8,000 - $15,000
**Timeline**: 10-12 weeks
**Result**: Unique, professional, full ownership

**Recommended designers**:
- Commercial Type
- Klim Type Foundry
- Pangram Pangram
- OHno Type Company
- Colophon Foundry

### Option B: Use Font Creation Tools
**Tools**: Glyphs, FontLab, RoboFont
**Cost**: $300 (software) + time
**Timeline**: 6-8 months (learning curve)
**Result**: DIY, full control, steeper learning curve

### Option C: Variable Font from Existing
**Approach**: License a variable font, customize with font editor
**Cost**: $200-500 (license) + $2,000-4,000 (customization)
**Timeline**: 4-6 weeks
**Result**: Semi-custom, faster, less unique

**Base fonts to consider**:
- Recursive (open source variable font)
- Fraunces (soft display serif)
- Anybody (geometric sans, open source)

## Hybrid Approach (RECOMMENDED)

### Phase 1: Production (Now)
Use **Crimson Pro + Work Sans** (Google Fonts)
- Immediate deployment
- Zero cost
- 80% of desired aesthetic

### Phase 2: Custom Display (6 months)
Commission **Crystalline Display** (display font only)
- Use for H1, H2, logo, hero text
- Keep Work Sans for body
- $5,000-8,000 investment
- Unique brand asset

### Phase 3: Full Family (Future)
Expand Crystalline to full family
- Text weights (300-500)
- Italics
- Extended glyphs
- Additional $8,000-12,000

## Technical Specifications

### Font Formats
- **WOFF2**: Primary (best compression)
- **WOFF**: Fallback (older browsers)
- **TTF**: Desktop use (design tools)
- **OTF**: Print (high-quality output)

### File Size Targets
- **Display Regular**: <40kb (WOFF2)
- **Display Bold**: <45kb (WOFF2)
- **Total**: <90kb (both weights)

### Subsetting Strategy
Create subsets for performance:
```
latin-basic.woff2      # A-Z, a-z, 0-9, basic punctuation (25kb)
latin-extended.woff2   # Accents, special chars (35kb)
scientific.woff2       # Symbols, math, Miller indices (40kb)
```

Load based on page content:
- Homepage: latin-basic
- Documentation: latin-extended
- Technical pages: scientific

## Brand Asset Value

A custom font becomes:
- **Visual IP**: Unique, ownable
- **Consistency**: Logo, web, print, merch
- **Authority**: Signals serious project
- **Longevity**: Doesn't age like trends
- **Licensing**: Can license to labs/institutions

## Example Custom Fonts in Similar Domains

- **NASA**: "Nasalization" (space-age)
- **National Geographic**: Custom serif (authority)
- **The North Face**: Custom geometric (outdoor)
- **Patagonia**: Custom sans (technical+natural)

None of these projects *needed* custom fonts, but they **elevated** the brand immensely.

## Quick Win: Variable Font Exploration

Before commissioning custom:

**Try**: Recursive (free variable font)
```css
@import url('https://fonts.googleapis.com/css2?family=Recursive:wght,CRSV,MONO@300..800,0..1,0..1&display=swap');

.experimental-display {
  font-family: 'Recursive', sans-serif;
  font-variation-settings:
    'MONO' 0,    /* Proportional */
    'CASL' 0.8,  /* More casual */
    'slnt' 0,    /* No slant */
    'CRSV' 0.3;  /* Slightly cursive */
  font-weight: 700;
}
```

Test if variable font tuning gets you close to vision before custom investment.

## Conclusion

**Short term**: Google Fonts (Crimson Pro + Work Sans) = excellent ROI
**Medium term**: Commission Crystalline Display = brand differentiation
**Long term**: Full Crystalline family = unreplicatable identity

The custom font is **not essential**, but it's the difference between a great gemmology site and **THE** definitive gemmology site.
