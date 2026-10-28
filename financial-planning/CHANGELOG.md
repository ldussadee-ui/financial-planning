# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioned with [SemVer](https://semver.org/).

## [0.26.5] - 2026-10-28

### Changed
- The TH/EN language switch at the top of every page is smaller: a rounded pill the same height as the settings gear and the back button next to it, instead of a taller square-cornered box that stood out from the rest of the row. You still see both TH and EN and tap the one you want

## [0.26.4] - 2026-10-28

### Changed
- On รายรับ-จ่าย the cycle row and the start-day button now fit on one line on a phone. Before, they took two lines and the › arrow could drop onto a line of its own. "รอบบัญชีปัจจุบัน" is now a small line above the dates, centred between ‹ and ›, and the start-day button is shortened to "เริ่ม 25" at the end of the row. Tapping it still opens the day picker, which now opens towards the left so it stays on screen. When you step back to an older cycle, the "กลับไปรอบปัจจุบัน" button appears on a second line only then. The payment summary uses the same row, so it changes the same way
- The three shortcut buttons under the cycle row are now one low row instead of tall buttons with the icon on top: each shows a small icon, filled with its colour (blue, pink, purple) like a colouring book, beside a short name, "รายงาน", "ช่องทางจ่าย" and "รายการประจำ" (Report, Payments, Recurring in English). The card takes about half the height it did. The full names are still the titles of the pages they open
- The report icon (on that shortcut and on the expense report page) is now a sheet of paper with a bar chart. The old pie chart had a deliberate gap in its outline that looked like a broken line once it was coloured in

## [0.26.3] - 2026-10-28

### Changed
- Card headings across the app (ภาพรวมรายจ่าย, แยกตามหมวดหมู่ and the trend chart in the expense report, every card in Settings, the checks and policies cards in Insurance, the comparison table in Asset Trend) were small grey text. They are now larger, bold and dark, so you can see at a glance where each card starts
- The labels above the numbers (รายรับ / รายจ่าย / คงเหลือ on รายรับ-จ่าย, the coloured tiles on the overview) and the row names in summary lists are now bold and dark instead of thin grey, so the label reads as clearly as the number under it
- The three shortcut buttons on รายรับ-จ่าย now show their icon above the label in bold text. The label gets the full width of the button, so "ช่องทางการจ่าย" no longer wraps onto three lines

### Fixed
- No text in the app is smaller than 12 any more. Text that was 10.5 to 11.5 was hard to read on a phone: the notes in the retirement comparison, the budget invite, the pass/fail badges on financial ratios and insurance, the chart axes, the bottom menu, the cycle buttons and the day picker

## [0.26.2] - 2026-10-28

### Fixed
- The small action icons that still had the old thin, grey look now match the Pop Sticker style: the › on every list row and on the overview score cards, the trash and pencil icons on assets, debts and goals, the × that closes a pop-up or a notice, the × on category chips while editing them, the + on the add buttons, and the settings gear. They are now bold and dark like the other buttons
- Rows in สภาพคล่อง, ลงทุน, ส่วนตัว and หนี้สิน had a plain coloured square at the start. Each square is now a sticker icon for what the row is: banknotes for cash, a bank for savings accounts, a candlestick chart for stocks, a pie chart for mutual funds, a building for property, a gem for gold, a car or house for personal items, a card or bank for debts. Investment rows keep their category colour, so a row still matches its slice in the allocation chart

## [0.26.1] - 2026-10-28

### Changed
- On the sub-pages (financial ratios, insurance, recurring entries, payment summary, expense report) only the back button now stays pinned to the top-left while you scroll. The TH/EN switch and the settings gear scroll away with the page like on the main screens, so they no longer cover a strip of the page the whole time. On the main screens nothing stays pinned at the top any more

### Fixed
- The round ‹ › buttons that step to the previous/next accounting cycle (รายรับ-จ่าย, payment summary) and period (expense report) now show a bold arrow drawn in the exact middle of the circle, with the same hard shadow as the other buttons. Before, the arrow was a thin text character that sat off-centre because of the font's spacing. Both screens now use one shared button, so they can't drift apart again
- The little arrows that open and close a section (Active/Passive and the other groups on รายรับ-จ่าย, the overview cards, the budget section in Settings, the retirement comparison in Goals, the categories in the expense report, which used small ▲▼ marks) were thin and hard to see. They are now a bold dark arrow, pointing right when closed and turning down when open

## [0.26.0] - 2026-10-28

### Changed
- Every emoji in the app is replaced by one matching icon set, "Pop Sticker": a line icon on a small coloured tile with the same dark outline and hard shadow as the cards and buttons. Emoji looked different on every phone and computer and clashed with the Bold Pop style; the new icons look the same everywhere and come from the same family as the bottom menu icons
- Page titles get a larger, slightly tilted sticker beside them, e.g. ภาพรวมการเงิน, สินทรัพย์สภาพคล่อง (now banknotes instead of the pig) and สินทรัพย์เพื่อการลงทุน (now a candlestick chart, like a stock chart, instead of the 📈 emoji)
- Labels, badges and buttons (รายการประจำ, รับ/จ่าย, ประจำ/ทั่วไป/ออมและลงทุน, warnings, tips, export/import, pass/fail and so on) use small stickers or plain line icons
- Every category has its own icon, coloured by group: income green, everyday spending yellow, monthly commitments purple, saving and investing pink. Categories you typed in yourself get a tag icon. Nothing in your saved data changes; the app picks the icon from the category name

## [0.25.0] - 2026-10-28

### Changed
- The back button on the sub-pages (financial ratios, insurance, recurring entries, payment summary, expense report) now sits on the same row as the TH/EN switch and the settings gear, instead of on its own row underneath. That frees a row at the top of the screen
- The back button has the Bold Pop look: a white pill with a dark outline and hard shadow, a big bold ‹ arrow, and the name of the page it goes back to ("‹ ภาพรวม" or "‹ รายรับ-จ่าย"), so you can see where it takes you before you tap. The old faint purple circle didn't match the other buttons and was easy to miss

### Added
- The top row (back button, language switch, settings) stays pinned to the top of the screen while you scroll, so you can go back or switch language from anywhere on a long page without scrolling up first

### Fixed
- On the recurring entries page, screen readers announced the back button as "back to overview" although it goes to รายรับ-จ่าย. All sub-pages now share one back button that takes its target and name from the page you're on, so this can't drift again

## [0.24.2] - 2026-10-28

### Changed
- The overview page header is now just the title "ภาพรวมการเงิน ☺️". The ✨ "ทดลองใช้งาน" badge is gone: it was only a decoration and didn't do anything, so it made the app look unfinished. The grey line under the title (a description plus the current cycle's dates) is gone too, so the numbers start higher on a phone screen. The cycle dates are still shown on the รายรับ-จ่าย and payment summary pages, where you pick the cycle

## [0.24.1] - 2026-10-28

### Changed
- New app icon to match the Bold Pop look: a yellow ฿ coin with a green seedling growing out of it, on purple, with the same dark outline and hard shadow as the cards. The old dark-green-and-gold icon came from the previous style and looked out of place next to the new screens. The ฿ stays so the icon is still recognisable, and the seedling ties it to the app's name เงินทองของเรา 🌱
- The splash and browser bar colour use the new periwinkle background instead of the old cream
- An icon already on a phone's home screen doesn't change by itself: remove it and add the app to the home screen again to get the new icon (this also lets you fix the name under it)

## [0.24.0] - 2026-10-27

### Changed
- A new look across the whole app ("Bold Pop"): white cards with a solid dark outline and a hard shadow on a light periwinkle background, flat bright colour blocks, and the Kanit typeface throughout. The old pastel style was soft enough that the important numbers and the buttons didn't stand out from everything else
- Buttons, chips, the TH/EN switch, the cycle arrows and the floating รับ/จ่าย buttons are now outlined blocks, so what can be tapped is obvious. Buttons on a coloured background use dark text, which reads better than white did on the pastel colours
- The bottom tab bar is solid white with a dark top line, and the active tab's icon fills yellow. On desktop the sidebar is yellow
- Investment category colours in the charts are brighter so the slices are easier to tell apart

### Added
- The overview opens with net worth on a big yellow card, showing how much it moved since last month and a small line of the last few months (from the history the app already records). Investable Net Worth sits at the bottom of the same card
- Liquid, investment, personal and liabilities are four coloured tiles under it. Tapping a tile lists what's in it, as the old expandable rows did
- Financial ratios and risk protection sit side by side, with one segment per criterion so the score reads at a glance
- The cashflow page shows the cycle's income, expenses and what's left as three boxes above the lists

## [0.23.1] - 2026-10-27

### Changed
- The overdue-backup card is gone from the top of the overview, where it pushed the net worth down every time a backup was more than 30 days old. The red dot on ⚙️ still appears when a backup is overdue, and the warning with the backup button is inside Settings as before

## [0.23.0] - 2026-10-27

### Changed
- Income and expense categories are now a short list of main categories, each holding #sub-items. The 34 expense categories that had built up became 14: อาหาร, บ้าน, เดินทาง, ท่องเที่ยว, สุขภาพ, ดูแลตัวเองและช้อปปิ้ง, งานและการเรียนรู้, งานอดิเรกและสัตว์เลี้ยง, ทำบุญ, อื่นๆ, บิลรายเดือน, ประกัน, ครอบครัว and ออมและลงทุน; income became รายได้จากงาน and รายได้จากทรัพย์สิน. With so many small categories, most of them holding one or two entries a cycle, the charts and summaries had become hard to read
- Everything already recorded moved across automatically the first time the app opens after updating: each old category became a # inside its main category (ค่าอาหาร → อาหาร #มื้อหลัก, Subscribe ChatGPT → บิลรายเดือน #ChatGPT), and the recurring rules, budgets and category buttons moved with them. Amounts, dates, payment methods and owners are unchanged. Duplicates were merged ("ของกินเล่น" and "ของกินเล่น/เครื่องดื่ม" are both #ของกินเล่น), and names with a stray vowel or trailing space ("ืทำบุญ", "Reinvestment ") were cleaned up. A category the list doesn't know stays as a main category of its own, so nothing is hidden
- Subscriptions and ค่าน้ำค่าไฟ now sit in บิลรายเดือน, which counts as Fixed (ประจำ), so they no longer trigger overspend alerts on the overview
- A budget set on an old category now belongs to its main category, adding up the old ones (a budget for ค่าอาหาร plus one for ของกินเล่น became one for อาหาร)

### Added
- The entry sheet shows the chosen category's #sub-items under the category buttons. Picking one is optional, and each entry takes at most one, so a category's #sub-items always add up to its total. "+ #ใหม่" adds a new one on the spot, and holding a category button to edit also lets a # be removed. Date, monthly repeat, adding or removing categories and the payment method work as before; a monthly repeat keeps its # too
- The cashflow list shows each entry's # beside its category, and on the expense summary a category can be tapped open to see its total split by #
- A new ✈️ ท่องเที่ยว category with #ที่พัก, #ค่าเดินทาง, #ค่ากิน and #ค่าเข้าชม
- Cashflow exports carry each entry's #. A file exported from an older version of the app is moved into the main categories as it is imported, and so is a full backup made before this version when it is restored, so neither can bring the old list back

## [0.22.0] - 2026-10-06

### Changed
- On a phone, Settings has moved out of the bottom bar to a ⚙️ beside the TH/EN toggle at the top of every page, so the bar holds four tabs with more room for each. It is still one tap away from anywhere. The desktop sidebar keeps Settings where it was

### Added
- Because the backup warning inside Settings is now out of sight, an overdue backup — never made, or more than 30 days old — is flagged in two places that are: a red dot on the ⚙️, and a card at the top of the overview explaining that everything lives only on this device, with a button that makes the backup right there (sharing it where the phone can). Both disappear as soon as a backup is made, and neither flashes up while the app is still opening
- The overview card, the dot and the Settings page all read "overdue" from one shared check, so they can't disagree

## [0.21.0] - 2026-10-06

### Added
- Cashflow exports now say how each expense was paid ("บัตร KTC", "เงินสด"), and imported entries keep it. On the payment summary, someone else's spending gets its own groups named after the method and the person — "💳 บัตร SCB · แม่" — rather than being mixed into your own cards, and without adding their cards to the list you pick from when recording your own spending

### Fixed
- Imported entries never appeared on the payment summary at all: importing cleared their payment method, and the page only listed expenses paid with one of this device's own methods. Every expense in the cycle now lands in some group. Imports that don't say how they were paid — including everything imported before this version, whose files never carried the method — go under "❔ ไม่ระบุช่องทาง · <name>"; to get them split by card, the other person needs to export again from the updated app
- Every payment method card had the same lavender background, so neighbouring groups were hard to tell apart. Each now has its own colour: cash is always green, cards take the next pastel along, and "no payment method" is a plain warm grey
- A recurring expense left on "—" for its payment method generated entries with no method, which then vanished from the payment summary. "—" is gone: as on the entry form, not choosing means cash, and existing rules that had "—" now generate cash entries. Our own past expenses with no method are counted under cash too

## [0.20.2] - 2026-09-30

### Changed
- "ให้แม่" and "ค่าจ้างทำสวน" now count as Fixed (ประจำ) expenses rather than ทั่วไป — they are monthly commitments, not day-to-day spending. Entries already saved under either category move across automatically the first time the app opens after updating, so past cycles and the expense summary reflect it too. As Fixed costs they no longer count toward the overspend alerts on the overview, which only watch day-to-day spending

## [0.20.1] - 2026-09-29

### Fixed
- Tapping a bar on the half-year or year chart listed every category, with ฿0 against the ones that month didn't spend on — a long list of zeros burying the real figures. v0.20.0 made this worse by filling in a zero for each missing category, but categories whose only entries were ฿0 (a paused subscription, say) had always shown. A month's breakdown now lists only categories that actually came to something

## [0.20.0] - 2026-09-29

### Added
- The half-year and year bar charts on the expense summary write each month's amount over its bar, so the figures can be read without tapping every bar. With all categories stacked the figure is the month's total, one per bar rather than one per colour; with a single category picked it is that category's amount. Months with no spending get no label
- Amounts under ten thousand are written in full (8,450) and larger ones in thousands (12.5k). Where the bars are too narrow for that — a year's twelve bars on a phone — the whole chart shortens together, first to thousands with one decimal and then to whole thousands (9k, 125k), so neighbouring labels never overlap; a half-year, or a year on a wider screen, keeps the full figures

## [0.19.0] - 2026-09-29

### Added
- Each group on the cashflow page — Active, Passive, Fixed, ทั่วไป and ออมและลงทุน — can be folded down to its header and total with a tap, and opened again the same way. A folded group stays folded the next time the app opens and when stepping to another cycle, so a list that has grown long can be kept out of the way

## [0.18.1] - 2026-09-28

### Fixed
- The share buttons for the cashflow and asset exports were hidden a level down, inside the dialog behind "ส่งออกข้อมูล", so they looked missing next to the backup's share button sitting on its card. The asset export has nothing to choose, so its dialog is gone: "แชร์" and "ดาวน์โหลด" now sit on the card and share in one tap. The cashflow export still needs a date range first, so it keeps its dialog, but the card's button now reads "แชร์ / ส่งออก" so it's clear sharing is inside

## [0.18.0] - 2026-09-28

### Added
- Exports can go straight to the phone's share sheet — LINE, mail, AirDrop, Drive or Files — instead of downloading first and then finding the file to send. The full backup, the cashflow export and the asset export each get a "แชร์" button where the browser can share files, with download kept beside it for anywhere the sheet doesn't reach; browsers that can't share files see the download button exactly as before
- Closing the share sheet without picking anywhere is not an error and doesn't count as a backup: "last backed up" only moves once the file has actually gone somewhere. If the browser refuses to share, it falls back to downloading so the tap isn't wasted
- A line under the backup's share button notes that the file holds all your financial data, and that sending it through a chat app leaves a copy on that app's servers

### Changed
- The three copies of the file-download code are now one shared helper, so the backup and both exports behave the same way

## [0.17.0] - 2026-09-22

### Changed
- The app has a real logo: a gold baht sign on money green, inside the faint ring of a coin — chosen from four options shown at actual size on phone home screens and browser tabs. It replaces the placeholder lavender square with a pink circle everywhere the app shows an icon: the browser tab (with slightly rounded corners, as tab icons are shown as drawn), the iPhone home screen, and Android's launcher and install prompt. Everything in the design sits inside the circle Android keeps when it crops icons round, so one drawing serves every platform
- The icon generator now draws the logo itself from a few circles, lines and arcs, still without an image library, so the design can be changed by editing the script and running it again
- The offline cache was renamed so that installed copies of the app drop the old icons instead of showing them until the next refresh. An iPhone only reads a home-screen icon when the app is added, so a copy already on the home screen keeps the old one until it is removed and added again — export a full backup first, as removing it can take its data with it

## [0.16.1] - 2026-09-22

### Changed
- Swiping between the asset tabs is more sensitive: 45px of travel switches tab instead of 70px, and a quick flick needs 20px instead of 30px — the "ไว" setting from the phone mockup

### Fixed
- A slightly slanted swipe could scroll the page up or down as it went. A drag that starts within 30° of level is now taken as a swipe after its first 8px, and the page is held still until the finger lifts; anything steeper is left alone as an ordinary scroll. Before, the line was drawn at 45°, with a separate 30° check only on release, so a drag at 35° moved the content and then sprang back without switching

## [0.16.0] - 2026-09-22

### Added
- The asset tabs can be changed by swiping on a phone: left for the next tab (สภาพคล่อง → ลงทุน → ส่วนตัว → หนี้สิน → แนวโน้ม), right for the one before. The tab bar's thumb follows the finger toward the tab it's heading for and lands on it once letting go would switch, so the gesture shows where it will end up; a short quick flick counts as well as a longer drag. At the first and last tab the content gives a little and springs back instead of wrapping around, and a swipe never leaves the Assets page for another screen. The distances are the middle of three settings tried on a phone mockup first
- Tapping a tab now slides the new one in from the same side a swipe would, so the two ways of switching read as one. Switching while scrolled far down a long list brings the tab bar back into view, so the new tab opens at its top with its name on screen
- A swipe only counts when it is clearly sideways, so scrolling with a slightly slanted thumb doesn't flip tabs, and it is ignored within 24px of either screen edge, which phones keep for their own back gesture. Anything that already takes sideways drags keeps them: dragging across the trend chart still moves its tooltip, and the comparison table still scrolls whenever it is wider than the screen. A swipe that ends over a row doesn't also open that row's edit form, and dragging inside an add/edit sheet can't switch the tab behind it, which would have closed the sheet with whatever had been typed so far

### Changed
- The floating + button is now rendered straight onto the page rather than inside each tab, so it stays put while a tab slides — inside the moving content, it would have ridden along with the list. It appears a moment after the page first loads rather than as part of the initial HTML

## [0.15.0] - 2026-09-21

### Added
- The payment method summary can step back through earlier cycles with the same ‹ › control the cashflow tab uses, so it now answers "how did I pay for last month" and not only this one. It counts by accounting cycle rather than calendar month, so its totals agree with the cashflow tab it is reached from. The cycle total moved out of the subtitle onto its own line beneath the stepper, next to the control that changes it

### Fixed
- The cashflow tab's link to the payment summary didn't pass along which cycle was on screen, so stepping back to August and tapping through showed September's payments, with nothing to say the two screens disagreed. The link now carries the cycle, and a hand-edited or malformed value falls back to the current cycle; an absurd one is clamped rather than looped through, which would otherwise have frozen the tab
- The summary's subtitle said "ในรอบปัจจุบัน" (in the current cycle), which stopped being true the moment the page could show any other

### Changed
- The cycle stepper and the date arithmetic behind it moved out of the cashflow tab into shared code, so both screens that step through cycles use one implementation. The arithmetic was checked against the old inline version across 720 combinations of start day, weekend shift, offset and date, with no differences

## [0.14.2] - 2026-09-12

### Fixed
- The rest of the entry sheet followed the confirm button: a selected category or payment chip, and the drop indicator while reordering chips, were all still teal inside the expense sheet. The whole sheet now takes the colour of the direction being entered, from a single value rather than hex literals scattered through the file

## [0.14.1] - 2026-09-12

### Fixed
- The confirm button in the expense entry sheet was teal — the colour this same screen uses to mean income — even though the sheet is reached by tapping the pink "จ่าย" button and is about money going out. Both sheets now confirm in the colour of the button that opened them, and the two cashflow colours live in one place so the floating button and the sheet cannot drift apart

## [0.14.0] - 2026-09-12

### Added
- The net worth trend chart now carries a growth line: the percentage change against the previous period, read off a second axis on the right. Its label follows the period switcher, so it says quarter, half-year or year rather than always month. A period with no snapshot leaves a gap in the line just as it already does in the bars, instead of drawing a trend across data that isn't there
- The right-hand axis takes its bounds from the data rather than a fixed range, since real growth sits in single digits most months and a fixed ceiling would press the line flat against the floor. Zero is always in view, so growing and shrinking read from which side of the axis a point sits on, and a minimum span stops a quiet run of 2-3% months being magnified into dramatic swings

### Fixed
- Percentage change was divided by the previous period's figure rather than its magnitude. Net worth is negative while a mortgage outweighs savings, and dividing by a negative base flips the sign — so paying a debt down from -฿400,000 to -฿250,000 was reported as **-37.5%**, an improvement shown as a loss in red, and the month a balance finally crossed into positive read as -150%. The sign now follows the direction the money actually moved. This corrects the existing "% เทียบเดือนก่อน" column too, which is where the error has been sitting
- The chart and that table column now compute growth through one shared function, so they cannot drift apart

## [0.13.2] - 2026-09-12

### Fixed
- The add/edit forms on the four asset tabs each came out a different shape despite being written with identical layout code. They were left to wrap, so where a row broke was decided by how long the words in it happened to be — a dropdown is as wide as its longest option — and on the debt form that pushed the last field onto the same line as the Cancel and Add buttons. Rows are now stated explicitly: one field per row, with a single deliberate pair for a debt's rate and monthly payment, and the buttons always on a row of their own
- Two placeholders were hardcoded English in the JSX, so "e.g. Honda City" stayed English inside a Thai form. Both now go through the translations
- The liquid assets form called its amount "จำนวนเงิน" while the investment and personal forms called the same `current_value` column "มูลค่าปัจจุบัน" — all three now agree

## [0.13.1] - 2026-09-12

### Fixed
- The monthly payment on a debt was being captured in the form and then shown nowhere at all. It now appears under the debt's name, which is the one line in these lists that was empty
- Rows across the four asset tabs described the same thing four different ways. A linked goal or debt is now written the same everywhere — with the "ผูกกับ" prefix that only the personal assets tab used, since without it a name like "สินเชื่อรถยนต์" reads as the item's own category rather than something it is tied to
- Two of the four tabs drew a colour block beside each row and two did not. All four do now: liquid, personal and debt each use one colour for the tab, while investments keep a colour per category, because those particular values are what the dashboard's allocation chart and the trend bars are drawn in

## [0.13.0] - 2026-09-04

### Added
- Budgets can now be set from the cashflow tab, beside the bars they control, instead of only from Settings. It is the same editor either way — opened inline in Settings where it has always lived, or as a sheet from an "แก้ไขงบ" button on the budget card — so the two cannot drift apart
- With no budgets set, the cashflow tab now offers to set some rather than showing nothing. The card only rendered when at least one budget existed, which left the whole feature invisible to anyone who had not already found it under a collapsed heading in Settings — a loop that could only be opened from the inside

### Changed
- The budget editor moved out of SettingsTab into its own component so both entry points share one implementation

## [0.12.1] - 2026-09-04

### Changed
- Amount fields and the calculator now group digits in thousands as you type, so a figure like 70,000 can be read at a glance instead of counted. The calculator's pending line already did this while the number being typed did not, which made the two halves of the same display disagree
- Grouping is applied to the display only — the value in state stays a plain number string, and the part after the decimal point is passed through exactly as typed, so "1234." keeps its point while you are still typing and "1.50" keeps its trailing zero

## [0.12.0] - 2026-09-04

### Added
- Settings now reports whether the browser has actually agreed to keep this data. The app has always asked for persistent storage on load but never looked at the answer, and browsers decide on their own heuristics — so whether the data could be deleted underneath you was invisible. When it is unprotected the page says so, explains what would delete it (roughly 7 days without opening the app on iPhone and iPad, low device storage elsewhere), offers a button to ask again, and points at installing to the Home Screen, which is what exempts it from the iOS rule and makes other browsers far likelier to agree

## [0.11.0] - 2026-09-04

### Added
- Full backup and restore, in Settings: one file holding every table, for moving to a new device or guarding against losing the lot. Rows are written back under their original ids, which is what keeps cross-table links intact — cashflow entries keep their payment method and recurring source, assets keep their goal, personal assets keep their debt — and makes restoring the same file twice a no-op rather than a duplication. The file records the schema version it was written under, and a backup from a newer version of the app is refused rather than restored into a shape this version cannot read
- "Erase all data", with a typed confirmation and a back-up-first button offered in the same dialog, since that moment is the last chance to keep anything
- A backup age indicator in Settings, turning red past a month. Data lives only in this browser with no copy on a server, so the app now says so plainly and says when it was last written out

### Changed
- The existing cashflow and assets export/import moved under a "รวมข้อมูลจากคนอื่น" heading that says what they actually do: append someone else's records to yours, with fresh ids and their original links dropped. The assets section previously described itself as being for moving data between devices, which it never could — it nulls every `goal_id` and `liability_id` on the way in

### Fixed
- Erasing everything cleared the settings table along with the rest, taking the flag that tells the seeder this database is already set up. The app would have quietly refilled itself with sample data on the next load; the flag is now preserved through both erase and restore

## [0.10.4] - 2026-09-04

### Fixed
- Category totals on the asset, liability, and payment-summary pages were rendered smaller than the item amounts they sum, which put the hierarchy upside down. They were built by concatenating the figure into the heading string ("เงินฝาก — ฿5,000"), so the total had no styling of its own at all. The amount is now its own element — right-aligned, bold, in tabular figures like the cashflow tab's totals — and sized between the cashflow section and subgroup totals, since these categories have no parent total above them but several can share a tab

## [0.10.3] - 2026-09-04

### Fixed
- The retirement target was computed with two different withdrawal-timing conventions depending on whether a post-retirement return was set. The no-return case correctly took each year's spending at the start of the year; the with-return case discounted as if the first year's money were only needed twelve months after retiring. The two disagreed by a factor of (1 + inflation), so raising the return from 0% to 0.05% made the target jump *up* by around ฿500,000 — earning more can never require saving more. Both branches now take spending at the start of the year, which matches a year-by-year simulation exactly at every rate tested
- The error was zero when the post-retirement return equalled inflation, so the default figure was always right; it grew as the assumption moved away from the default, overstating by up to 2.5% below it and understating by 1.9% at 5% — understating being the more dangerous direction. Targets already saved are recomputed from their stored assumptions when the goal is reopened

## [0.10.2] - 2026-09-04

### Changed
- The assumption comparison table now reads as a table: its column headings are larger, bolder, and in the primary text color instead of whispering above the figures in small grey caps, with a hairline rule tying them to the rows beneath and more room between rows. The headings are no longer uppercased — it does nothing for Thai and only made the English heading longer and shoutier — and the first column is wider, since the value columns only ever hold figures like "฿217,575"

## [0.10.1] - 2026-09-04

### Fixed
- The comparison table's first column was headed just "ผลตอบแทน", which doesn't say which of the form's two returns it varies — and the teaser line that did say so is hidden once the table is open. It now names the assumption in full
- The note under the table described the already-saved amount as "เงินที่ผูกไว้", app jargon for what a reader would call the principal they've saved so far, and didn't mention that a value outside the listed rates can be typed into the field above
- The goal type and priority dropdowns split their row evenly despite the longest goal type ("กองทุนฉุกเฉิน") needing roughly twice the room of the longest priority ("กลาง") — now 2:1

## [0.10.0] - 2026-09-04

### Added
- A retirement planning helper on goals of type "เกษียณ": enter what you expect to spend per month in today's money, how many years the money has to last, an inflation rate, and an assumed return during retirement, and the goal's target amount is worked out for you — inflating the spending to your retirement date, then either summing the still-inflating years or discounting them at the return net of inflation. Everything downstream already worked from the target, so the existing "recommended monthly savings", progress bar, and linked-asset tracking need no change to benefit
- The assumptions are stored on the goal rather than only the number they produce, so reopening it later shows where the target came from and lets you adjust one input without re-entering the rest
- A collapsible comparison of what the target and the required monthly saving become across post-retirement returns from 0–5%, since that single assumption moves the answer by around 40%. Its closed state shows the resulting range, and tapping any row adopts that assumption
- A "คำนวณให้ / ใส่เอง" switch for goals where you already have a target figure from elsewhere. Without an explicit mode, touching any assumption would silently overwrite a hand-typed number; goals created before this release open in "ใส่เอง", which is what they always were

### Changed
- The goal form is reordered by role: the two classification dropdowns pair on one row, the accumulation return moves above the target date (which for a retirement goal is the helper's first input, so nothing sits between them), and the form now ends on the target amount rather than burying it
- "ผลตอบแทนคาดหวัง" is now "ผลตอบแทนช่วงเก็บเงิน", reading as a pair with the new "ผลตอบแทนหลังเกษียณ" — two different rates for two different stretches of time that were easy to confuse under one name

## [0.9.5] - 2026-09-03

### Fixed
- The cashflow cycle card (cycle nav, day-start picker, and 3 shortcut links) was a single flex-wrap row with no grouping, so shortcut labels could wrap unpredictably on mobile — even mid-word. Regrouped into two rows: cycle range + day-start together on top, and the 3 shortcuts below as an equal-width row so all three are always visible with no scrolling; also shortened the shortcut labels (dropped a redundant "Summary" prefix and the trailing arrows, now redundant since the shortcuts already read as tappable pills)

## [0.9.4] - 2026-09-01

### Fixed
- The 0.9.3 fix didn't fully resolve the mobile calculator issue — confirmed by a real device recording showing a tap-highlight on the close button followed by no response. The underlying issue was structural: a modal opened from inside another modal (the amount-entry calculator) was a genuine DOM descendant of the outer one, not just visually layered — the same class of issue already responsible for one clipping bug this project hit before. Modals now render through a React portal straight onto `<body>` instead of nesting in the DOM at the point they're written in the tree, so a nested modal is no longer a descendant of its parent at all. Re-verified every modal interaction (open, close via X/backdrop/drag/Escape, nested focus-trap isolation, focus restoration, calculator confirm) still works correctly

## [0.9.3] - 2026-09-01

### Fixed
- Could not enter cashflow amounts or edit asset values on mobile — two compounding issues in the shared amount-entry calculator: the field that opens it was a `readonly` `<input>`, which mobile Safari/Chrome don't always reliably deliver taps to, so tapping it sometimes did nothing (now a real `<button>`); and once the calculator did open, it immediately focused itself for accessibility (screen reader dialog announcement), which on some mobile browsers nudges the page's scroll position right as a tap is landing — the browser then discards the tap as a drag rather than firing a click, silently eating taps on the "X" close and confirm buttons. Confirmed via a screen recording showing a real tap-highlight on the close button followed by nothing happening. The focus now waits a frame for layout to settle and explicitly opts out of scroll-into-view

## [0.9.2] - 2026-09-01

### Fixed
- Cashflow category colors (Active/Passive/Fixed/General/Savings & Investing) were hard to read against their own group's background tint, and Savings & Investing was visually identical to Active income (same green) even though they're unrelated categories — each class now gets its own distinct hue, verified at 4.5:1+ contrast against its background
- Each cashflow subgroup (Active, Passive, Fixed, General, Savings & Investing) now renders on its own tinted background block instead of all subgroups within a section sharing one uniform card background, making them easier to tell apart at a glance
- Expense entries categorized as "PVD" or "Reinvestment" (or the Thai "กองทุนสำรองเลี้ยงชีพ") were auto-classified as General instead of Savings & Investing, since those weren't in the keyword list the auto-classifier checks — added them, and existing entries are reclassified retroactively on upgrade

## [0.9.1] - 2026-08-31

### Fixed
- Addressed all 16 findings from an accessibility audit (WCAG 2.1/2.2):
  - **Contrast**: the app-wide secondary-text color and two other hardcoded grays (used for the sidebar, language toggle, section headers, ratio card text, and inactive tabs) were below the 4.5:1 minimum — unified to a single darker color (5.3–6.5:1 against every background it appears on)
  - **Touch targets**: sidebar rows, the language toggle, and the floating add buttons were smaller than the recommended 44×44px on mobile — enlarged
  - **Keyboard focus**: no element had a visible focus indicator anywhere in the app — added one globally; the language toggle's DOM position put it after the sidebar in tab order despite sitting visually above it — moved it out of the Dashboard page into the shared layout (now also reachable from every tab, not just the Dashboard); the sidebar and bottom nav landmarks had no distinguishing label for screen readers — added one to each
  - **Semantic structure**: no heading elements existed anywhere, so screen reader users couldn't jump between sections — added a page `<h1>` and card-level `<h2>`s; form fields (asset/goal/etc. modals) had visible label text with no programmatic association — `Field` now renders a native `<label>` wrapping its control; modals weren't announced as dialogs and keyboard focus could tab out into the page behind them — added `role="dialog"`, `aria-modal`, `aria-labelledby`, and a real focus trap (correctly scoped for a modal opened from inside another modal, e.g. the amount field's calculator)
  - **Color-only indicators**: the pass/fail progress bars on the Dashboard relied on color alone to separate the two segments — added a visible divider

## [0.9.0] - 2026-08-31

### Added
- Recurring income/expense entries: toggle "Repeat this entry every month" when adding a new entry, pick the day of the month (with the same weekend-shift option as the cycle start day) — the app generates a real cashflow entry automatically each month from then on, catching up on any months missed while the app was closed. A new "Recurring Entries" page (linked from the Cashflow tab) lists all of them with pause/resume, edit, and delete; editing or deleting a recurring entry never changes months already generated. Entries created this way show a "From a recurring entry" badge linking back to their source
- A one-time dismissible notice on the Cashflow tab lists whatever recurring entries were just auto-generated, so new entries never appear silently

### Fixed
- `getCycleRange()` (used for the current cycle everywhere in the app) produced an invalid, inverted date range when the cycle start day was 1 or 2 with weekend-shifting on and the shift crossed into the previous month, and was off by one day for cycle start days of 29–31 in short months (day 30/31 in a 30-day month, day 29–31 in February) — both were edge cases in how the day was clamped and which month the *next* cycle boundary was computed from; cycle start days from 3–28 were never affected

## [0.8.1] - 2026-08-23

### Fixed
- Cashflow tab's selected month stayed on whatever cycle was last viewed instead of returning to the current one after the app had been reopened — as a PWA, the tab is usually suspended rather than fully closed, so its in-memory state survives; the app now resets to the current cycle when it's been hidden for more than 10 minutes, while a brief switch to another app leaves the selected month alone
- Cashflow tab's current-cycle calculation (including the "back to current cycle" button and the ‹ › navigation) could land one full cycle off from the real current one whenever the billing cycle's start day is after the 15th and today has already passed it this month — it anchored on a fixed mid-month reference date instead of today's actual date; cycle navigation now steps from the real current cycle instead

## [0.8.0] - 2026-08-23

### Added
- Risk Protection page (`/dashboard/insurance`): tracks insurance policies (life, health, accident, critical illness, credit life) and checks them against 4 standard-based rules — life coverage gap (10 years of living expenses plus liabilities, net of liquid/investment assets), health coverage (existence check), credit-life coverage vs. remaining long-term debt, and total premiums vs. 15% of annual income
- Alerts for policies expiring within 60 days and policies missing a named beneficiary
- New "🛡️ Risk Protection" card on the Dashboard showing pass/fail count, linking to the full page
- Fully bilingual (TH/EN), consistent with the rest of the app

## [0.7.1] - 2026-08-21

### Fixed
- Pie chart tooltips (expense-by-category on the reports page, investment allocation on the Dashboard) still showed the raw Thai category/investment-category name in English mode — Recharts reads pie labels straight from the data instead of the translated `name` prop used elsewhere; the tooltip formatter now translates the label too

## [0.7.0] - 2026-08-21

### Added
- English language support with a TH/EN switch on the Dashboard — translates every tab (Cashflow, Assets, Goals, Settings, Reports, Payment Summary, Financial Ratios), the calculator, and all shared components. Stored data (categories, asset/goal/liability names) always stays in Thai regardless of display language; only known default labels are translated for display, so switching language never touches saved data or breaks the Thai-keyword auto-classification. Custom text the user typed themselves always shows verbatim
- Dates and month names in charts/tables now switch locale (Thai/English) along with the rest of the UI

### Fixed
- Calendar year is now always Gregorian (ค.ศ.) everywhere, regardless of language — some date displays previously used the Buddhist Era (พ.ศ.)

## [0.6.2] - 2026-08-20

### Fixed
- Calculator popup opened from inside another sheet (editing an asset or cashflow amount) still rendered incomplete after the 0.6.1 fix — the real cause was the drag-to-dismiss `transform` on the outer sheet, which (per CSS spec) turns it into a containing block for any `position:fixed` descendant, clipping the nested calculator to the outer sheet's own box instead of the real viewport. `transform` is now only applied while actively dragging, not at rest

## [0.6.1] - 2026-08-20

### Fixed
- Calculator popup (and other bottom sheets) could render taller than the visible screen on mobile Safari, pushing the top rows off-screen while the address bar was showing — `vh` sizes against the viewport with browser chrome hidden, not the currently-visible one; switched to `dvh` (with a `vh` fallback) so the sheet sizes against what's actually visible

## [0.6.0] - 2026-08-20

### Added
- iOS-style UI pass: segmented controls (asset sub-tabs, trend granularity, table row count, expense report granularity) replacing separate chip-button rows; bottom sheet gets a drag handle, blurred backdrop, and drag-to-dismiss; bottom nav bar is translucent/blurred with a filled icon for the active tab
- Colored subgroup headers in the cashflow tab (Active/Passive/Fixed/ทั่วไป/ออมและลงทุน) — label and amount both tinted to the class's color and right-aligned, instead of a plain gray line

### Changed
- Grouped-list look app-wide: card corner radius reduced (22px → 14px), row dividers inset past the icon instead of full-width, and tappable rows show a trailing chevron instead of a pencil icon
- Income/Expense entry badges now distinguish Active vs Passive (two shades of green) and Fixed vs ทั่วไป (two shades of orange), matching each section's own color instead of sharing one shade across income and expense

## [0.5.2] - 2026-08-19

### Fixed
- Asset trend chart legend order (was jumping "Net Worth" to the front) — Recharts' default legend sorting is alphabetical, which ranks the Latin label ahead of the Thai ones regardless of bar order; now matches the bars left-to-right (สินทรัพย์ทั้งหมด/หนี้สินทั้งหมด/Net Worth)

## [0.5.1] - 2026-08-19

### Fixed
- Category chips in the income/expense entry form couldn't be reordered on mobile — they used the HTML5 drag-and-drop API, which never fires on touch; switched to Pointer Events so long-press-and-drag reordering works on phones

### Added
- "ของใช้ในบ้าน" default expense category, added retroactively for existing installs too

## [0.5.0] - 2026-08-19

### Added
- Cashflow tab can now navigate to previous/next billing cycles (‹ › buttons) to view and edit past months' entries, instead of only ever showing the current cycle
- Dashboard cards (goal progress, investment allocation, passive income) are now collapsible accordions, showing just the key stat by default and expanding to full detail on tap — keeps the page shorter on mobile

### Changed
- "อัตราส่วนสภาพคล่องพื้นฐาน" now only fails on the low side (< 3 เท่า) instead of also failing above 6 เท่า — the "too much idle cash" signal is already covered separately by the investment ratio, and the two-sided check could make it read as contradicting "สภาพคล่องต่อความมั่งคั่งสุทธิ" for low-net-worth cases

## [0.4.2] - 2026-08-17

### Changed
- Goal progress rows on the Dashboard now show the % complete next to the saved/target amounts, matching the Goals tab

## [0.4.1] - 2026-08-17

### Changed
- Renamed the "Variable (ผันแปร)" expense class to "ทั่วไป" everywhere it's shown (cashflow tab, reports, entry-modal badge) — plainer, easier-to-understand wording

## [0.4.0] - 2026-08-17

### Added
- Personal financial ratios (the standard 10-ratio CFP-style set: survival, passive income, liquidity, wealth, debt-to-asset, debt service, savings, investment, current ratio) on a new "อัตราส่วนทางการเงิน" page, each with a pass/fail badge against its standard benchmark
- Dashboard summary card (between the asset-allocation chart and the Passive Income card) showing "X จาก 10 ข้อ ผ่านเกณฑ์" with a link through to the full breakdown
- Short actionable advice shown under any ratio that fails its benchmark

## [0.3.1] - 2026-08-17

### Changed
- Raised the mobile type-scale floor app-wide (chart axis labels, row meta text, table headers/cells, item names) — nothing renders below 11px anymore, was as small as 9px in places

## [0.3.0] - 2026-08-17

### Added
- Asset trend chart on a new "แนวโน้ม" tab in Assets: total assets, total liabilities, and net worth as grouped bars per period, switchable between month/quarter/half-year/year
- Daily net-worth snapshots (`netWorthHistory`), recorded automatically whenever an asset or liability changes or the app opens on a new day — the only source of history, since asset rows only ever stored their current value
- Month-by-month comparison table (assets/liabilities/net worth plus the change and % change vs the previous month), with a selectable row count

## [0.2.0] - 2026-08-16

### Added
- Tap-to-edit rows for assets, liabilities, and goals, with a shared Add FAB + modal pattern replacing the old always-visible forms
- Dashboard net-worth drilldowns (expandable rows for liquid/investment/personal/liability totals)
- "ออมและลงทุน" (saving/investment) expense classification, auto-detected from category keywords, alongside Fixed/Variable
- Settings tab: hourly-wage (auto-computed or manual), primary goal picker, cashflow & asset export/import
- Spend-vs-wage and spend-vs-goal comparisons, shown live while entering an expense and on saved rows
- Per-goal expected return and a recommended-monthly-savings figure (future-value-of-annuity math)
- Asset tabs (Liquid/Investment/Personal) grouped by category with per-group subtotals
- "ออมเงิน" / "ลงทุน DCA" default expense categories
- Per-category monthly expense budgets, shown as progress bars on the cashflow tab, the reports page, and a Variable-only alert card on the dashboard
- Monthly category trend chart on the reports page (stacked by category, or isolate one category), shown when viewing by half-year or year
- Calculator-style input for every money field app-wide

### Changed
- Unified color tokens (positive/danger/muted-label), list-row dividers, category icons, and font-weight hierarchy for a cleaner, less busy look
- Selection/accent color changed from pink to teal
- Auto-computed hourly wage now tracks the current billing cycle's Active income live (excluding bonuses/incentives/commissions) instead of a one-time guess
- Tuned first-run sample data for internal consistency (car loan payment now has a matching cashflow entry; the emergency-fund goal is no longer already 100% funded on day one)

### Fixed
- Initial-load redirect moved to an edge-level config redirect instead of a server-rendered page (cut ~700ms off first load)
- Removed an unused font weight to cut two font file downloads
- Dev server launch config now invokes `node.exe` directly instead of `npm.cmd`, which was failing to resolve `node` on PATH in the preview server's spawned process

## [0.1.0] - 2026-08-xx

Initial scaffold: Next.js + PWA app with cashflow tracking, liquid/investment/personal assets, liabilities, and goals, backed by Dexie (IndexedDB).
