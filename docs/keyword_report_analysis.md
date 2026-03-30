# Keyword Ranking Report — Structure Analysis

## Source File
`KeywordRankingReportofleadflowpartners.comason28-Mar-2026(1).xlsx`

## Sheet: "Keyword Status Report"

### Layout
- Single sheet, A1:T54 (54 rows, 20 columns used A–H for data)
- Header row (Row 1): Keywords | Starting Date | Monthly snapshots (Oct 25 → Mar 26)
- Data rows (Rows 2–51): One keyword per row
- Footer (Rows 53–54): Search Engine: Google.com | Target Location: USA

### Column Structure
| Column | Content |
|--------|---------|
| A | Keyword phrase |
| B | 23-Sep-25 (Starting baseline — all "Not Found") |
| C | 31-Oct-25 |
| D | 30-Nov-25 |
| E | 31-Dec-25 |
| F | 30-Jan-26 |
| G | 28-Feb-26 |
| H | 28-Mar-26 (current) |

### Values
- `Not Found` = keyword not ranking in top 100
- Integer (1–100) = Google position number
- Lower number = better rank

### Color Coding (visual from PDF)
- Green cells = positions 1–10 (page 1)
- Yellow/orange cells = positions 11–20 (page 2)
- Red/pink cells = positions 21–50 (page 3–5)
- White/no color = Not Found or position 51–100

### Key Observations
- 50 keywords tracked total
- Most started "Not Found" in Sep 2025
- By Mar 2026: top keywords at positions 1–8 (page 1)
- Clear upward trend — positions improving month over month
- Report shows 6 months of monthly snapshots

## Our Version — breakyoursolarcontract.com

### Data Source
- Google Search Console API (property 530239045)
- Our `seoPages` database table (for page inventory)
- Manual GSC export for historical snapshots

### Keywords to Track (from GSC data)
22+ queries already showing impressions:
1. selling a house with leased solar panels (pos ~11)
2. cancel solar contract (pos ~11)
3. stuck in solar panel contract
4. how to get out of a solar panel lease
5. how to cancel solar panel contract
6. how to cancel sunrun contract before installation
7. + 16 more from GSC

### Report Format to Build
Same structure:
- Column A: Keyword
- Column B: Starting baseline (today, Mar 28 2026)
- Columns C+: Monthly snapshots going forward
- Color coding: Green (1-10), Yellow (11-20), Orange (21-50), Red (51-100), Gray (Not Found)
- Footer: Search Engine: Google.com | Target Location: USA
