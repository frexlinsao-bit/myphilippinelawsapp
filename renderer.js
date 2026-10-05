let laws = [];

let selectedCategory = null;
let selectedLaw = null;
let selectedArticleNumber = null;

/* =========================================================
   ELEMENTS
   ========================================================= */

const categoryList = document.getElementById("categoryList");
const categoryView = document.getElementById("categoryView");
const lawView = document.getElementById("lawView");
const lawCategoryTitle = document.getElementById("lawCategoryTitle");
const lawList = document.getElementById("lawList");

const selectedLawView =
    document.getElementById("selectedLawView");

const selectedLawBackButton =
    document.getElementById("selectedLawBackButton");

const selectedLawNumber =
    document.getElementById("selectedLawNumber");

const selectedLawTitle =
    document.getElementById("selectedLawTitle");

const selectedLawCount =
    document.getElementById("selectedLawCount");

const sectionList =
    document.getElementById("sectionList");

const lawBackButton =
    document.getElementById("lawBackButton");

const articleView =
    document.getElementById("articleView");

const articleBackButton =
    document.getElementById("articleBackButton");

const readerLawNumber =
    document.getElementById("readerLawNumber");

const readerLawTitle =
    document.getElementById("readerLawTitle");

const readerArticleSelector =
    document.getElementById("readerArticleSelector");

const articleTitle =
    document.getElementById("articleTitle");

const articleText =
    document.getElementById("articleText");

const previousArticle =
    document.getElementById("previousArticle");

const nextArticle =
    document.getElementById("nextArticle");

const articleSelector =
    document.getElementById("articleSelector");

const openArticleButton =
    document.getElementById("openArticleButton");

const browseView =
    document.getElementById("browseView");


/* =========================================================
   LAW OF THE DAY ELEMENTS
   ========================================================= */

const lawOfDayView =
    document.getElementById("lawOfDayView");

const lawOfDayBackButton =
    document.getElementById("lawOfDayBackButton");

const lawOfDayNumber =
    document.getElementById("lawOfDayNumber");

const lawOfDayTitle =
    document.getElementById("lawOfDayTitle");

const lawOfDayProvisionNumber =
    document.getElementById("lawOfDayProvisionNumber");

const lawOfDayProvisionText =
    document.getElementById("lawOfDayProvisionText");

const lawOfDayNoteButton =
    document.getElementById("lawOfDayNoteButton");

const lawOfDayCopyButton =
    document.getElementById("lawOfDayCopyButton");

let lawOfDayArticle = null;

/* =========================================================
   HELPERS
   ========================================================= */

function cleanLawTitle(law) {

    if (!law) {
        return "";
    }

    const type =
        normalizeCategory(law.type || "");

    const rawTitle =
        String(
            law.title ||
            law.name ||
            ""
        ).trim();

    const rawText =
        String(
            law.text ||
            law.titleSource ||
            ""
        ).trim();

    const lawArticles =
        Array.isArray(law.articles)
            ? law.articles
            : [];

    let title = rawTitle;

    /*
     * Decode common HTML entities without changing the source
     * wording. This fixes display such as MALACA&Ntilde;AN.
     */
    function decodeDisplayText(value) {

        const text =
            String(value || "");

        const element =
            document.createElement("textarea");

        element.innerHTML =
            text;

        return element.value;
    }

    /*
     * Find a useful descriptive line from the source text.
     * Skip institutional headers, document identifiers and
     * obvious structural headings.
     */
    function sourceDescription(text) {

        if (!text) {
            return "";
        }

        const lines =
            text
                .split(/\r?\n/)
                .map(function (line) {
                    return decodeDisplayText(
                        line.trim()
                    );
                })
                .map(function (line) {
                    return line
                        .replace(/\s+/g, " ")
                        .trim();
                })
                .filter(function (line) {
                    return line.length > 0;
                });

        for (const line of lines) {

            const cleaned =
                line
                    .replace(
                        /^\[.*?\]\s*/i,
                        ""
                    )
                    .trim();

            if (!cleaned) {
                continue;
            }

            /*
             * Create a normalized OCR comparison form.
             * This is ONLY used for detecting headers/noise.
             * The original source wording is preserved.
             */
            const headerCheck =
                cleaned
                    .replace(/[^A-Za-zÑñ]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toUpperCase();

            const headerCompact =
                headerCheck
                    .replace(/\s+/g, "");
            /*
             * Memorandum Order OCR cleanup:
             * Skip obvious MALACAÑANG / PMS LIBRARY header lines
             * when they are incorrectly selected as the display title.
             *
             * This checks only the candidate source line. It does not
             * inspect article text, so genuine legal documents that
             * contain library/footer text are preserved.
             */
            if (type === "Memorandum Order") {
                const libraryCompact =
                    cleaned
                        .toUpperCase()
                        .replace(/[^A-Z]/g, "");

                const looksLikeLibraryHeader =
                    /^M.?L.?CANANG/.test(libraryCompact) &&
                    /PMSL+BRAR[VIY]/.test(libraryCompact);

                if (looksLikeLibraryHeader) {
                    continue;
                }
            }


            /*
             * Institutional headers.
             */
            if (
                /^(?:REPUBLIC OF THE PHILIPPINES|SUPREME COURT|MALACAÑAN|MALACANANG|MALACAÑAN PALACE|MALACANANG PALACE|MANILA|MALACAÑAN PALACE MANILA|MALACANANG PALACE MANILA)$/i
                    .test(headerCheck)
            ) {
                continue;
            }

            /*
             * Jurisprudence Supreme Court location headers.
             * These are institutional headers, not case captions.
             *
             * Example:
             * "Republic of the Philippines SUPREME COURT Baguio City"
             */
            if (
                type === "Jurisprudence" &&
                /^REPUBLIC OF THE PHILIPPINES\s+SUPREME COURT(?:\s+(?:BAGUIO CITY|MANILA))?$/i
                    .test(headerCheck)
            ) {
                continue;
            }

            /*
             * Common OCR variants of MALACAÑAN / MALACAÑAN PALACE.
             */
            if (
                /^MALA(?:CA|CAN|CANA|CANA[NÑ]|CANA[NÑ]PALACE|CANA[NÑ]PALACEMANILA)/i
                    .test(headerCompact)
            ) {
                continue;
            }

            /*
             * Presidential / Governor-General issuing lines.
             * The compact comparison catches OCR that removes spaces
             * or corrupts punctuation.
             */
            if (
                /^BY THE PRESIDENT OF THE PHILIPPINES$/i.test(headerCheck) ||
                /^BY THE GOVERNOR GENERAL OF THE PHILIPPINE ISLANDS?$/i.test(headerCheck) ||
                /^BY THE PRESIDENT$/i.test(headerCheck)
            ) {
                continue;
            }

            if (
                /^BYTHEPRESIDENTOFTHEPHILIPPINES$/i.test(headerCompact) ||
                /^BYTHEGOVERNORGENERALOF THEPHILIPPINEISLANDS?$/i.test(headerCheck.replace(/\s+/g, "")) ||
                /^BYTHEPRESIDENT$/i.test(headerCompact)
            ) {
                continue;
            }

            /*
             * OCR-corrupted issuing lines that are still clearly
             * variations of "BY THE PRESIDENT..."
             */
            const byPresidentCompact =
                headerCompact
                    .replace(/[0O]/g, "O")
                    .replace(/[1I|]/g, "I")
                    .replace(/[5S]/g, "S");

            /*
             * Reject OCR-corrupted variants of presidential
             * and Governor-General issuing lines.
             *
             * These lines can contain punctuation, missing
             * spaces, or character substitutions while still
             * retaining enough readable text to pass the normal
             * noise filter.
             */
            const issuingCompact =
                headerCompact
                    .replace(/[0O]/g, "O")
                    .replace(/[1I|]/g, "I")
                    .replace(/[5S]/g, "S")
                    .replace(/[^A-Z]/g, "");

            if (
                /^BYTHEPRESIDENT(?:OFTHEPHILIPPINES)?$/.test(
                    issuingCompact
                ) ||
                /^BYTHEGOVERNORGENERALOFTHEPHILIPPINEISLANDS?$/.test(
                    issuingCompact
                )
            ) {
                continue;
            }

            /*
             * Reject OCR-corrupted variants of:
             * "BY THE PRESIDENT OF THE PHILIPPINES"
             *
             * This deliberately requires the recognizable
             * presidential issuing-line structure rather than
             * relying on an exact spelling match.
             */
            const issuingWords =
                headerCheck
                    .split(/\s+/)
                    .filter(function (word) {
                        return word.length > 0;
                    });

            if (
                issuingWords.length >= 2 &&
                /^BYT/.test(headerCompact) &&
                /PRES/.test(headerCompact) &&
                /DENT/.test(headerCompact) &&
                /PHILIPP/.test(headerCompact)
            ) {
                continue;
            }

            /*
             * Reject heavily OCR-corrupted variants of the
             * presidential issuing line, such as:
             * "BYtHE~PRESlDE"'T Of THE PHILIPPINES"
             */
            const issuingCompactOCR =
                headerCheck
                    .replace(/[^A-Za-z]/g, "")
                    .toUpperCase();

            if (
                /^BYTHE/.test(issuingCompactOCR) &&
                /PRES/.test(issuingCompactOCR) &&
                /DENT/.test(issuingCompactOCR) &&
                /PHILIPP/.test(issuingCompactOCR)
            ) {
                continue;
            }

            if (
                /^BYTHEPRES[I1]DENTOFTHEPH[I1]L[I1]PP[I1]NES$/.test(
                    byPresidentCompact
                ) ||
                /^BYTHEPRES[I1]DENT$/.test(
                    byPresidentCompact
                )
            ) {
                continue;
            }

            /*
             * Reject heavily corrupted MALACAÑAN headers.
             */
            const malacananCompact =
                headerCompact
                    .replace(/[0O]/g, "O")
                    .replace(/[1I|]/g, "I")
                    .replace(/[5S]/g, "S")
                    .replace(/[^A-Z]/g, "");

            if (
                /^MALAC/.test(malacananCompact) &&
                (
                    malacananCompact.length <= 14 ||
                    /^MALACANAN(?:PALACE)?(?:MANILA)?$/.test(
                        malacananCompact
                    )
                )
            ) {
                continue;
            }

            /*
             * Jurisprudence metadata is not a case title.
             * Skip division labels and generic year/month index labels.
             */
            if (
                type === "Jurisprudence" &&
                (
                    /^(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+DIVISION$/i.test(cleaned) ||
                    /^\s*(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}\s*-\s*PHILIPPINE\s+JURISPRUDENCE\s*$/i.test(cleaned) ||
                    /^PHILIPPINE\s+JURISPRUDENCE(?:\s*-\s*.*)?$/i.test(cleaned) ||
                    /^\$?upreme\s+QCourt$/i.test(cleaned) ||
                    /^CASE\s+NUMBER\s+CASE\s+TITLE$/i.test(cleaned) ||
                    /^\(FORMERLY\b.*\)$/i.test(cleaned) ||
                    /^\s*[^A-Za-z]{0,3}E?PUBLIC\s+OF\s+THE\s+PHILIPPINES\s*$/i.test(cleaned) ||
                    /^REPUBLIC\s+OF\s+THE\s+PHILIPPINES$/i.test(cleaned) ||
                    /^~?\s*epublic\s+of\s+tbe\s+!tbilippines\s*$/i.test(cleaned)
                )
            ) {
                continue;
            }

            /*
             * Legal document identifiers.
             *
             * This also catches the historical Lawphil heading:
             * "Proclamation No. 10 Series of 1935"
             * so the renderer continues to the actual descriptive title.
             */
            if (
                /^PROCLAMATION\s+NO\.?\s*[\w-]+\s+SERIES\s+OF\s+\d{4}$/i
                    .test(cleaned)
            ) {
                continue;
            }

            if (
                /^(?:ADMINISTRATIVE\s+ORDER|MEMORANDUM\s+CIRCULAR|MEMORANDUM\s+ORDER|PROCLAMATION|SPECIAL\s+ORDER)\s+NO\.?/i
                    .test(cleaned)
            ) {
                continue;
            }

            if (
                /^(?:A\.?\s*M\.?|G\.?\s*R\.?|A\.?\s*C\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.|OCA)\s+No\./i
                    .test(cleaned)
            ) {
                continue;
            }

            if (
                /^(?:CIRCULAR|SUPERVISORY\s+CIRCULAR|RESOLUTION|RULES\s+OF\s+COURT)\b/i
                    .test(cleaned)
            ) {
                continue;
            }

            if (
                /^DOC-[a-z0-9]+$/i.test(cleaned)
            ) {
                continue;
            }

            /*
             * Historical series labels are metadata, not titles.
             */
            if (
                /^Series\s+of\s+\d{4}$/i.test(cleaned)
            ) {
                continue;
            }

            /*
             * Standalone country/header fragments.
             */
            if (
                /^(?:PHILIPPINES|PHILIPPINE|MANILA)$/i.test(headerCheck)
            ) {
                continue;
            }

            /*
             * Standalone numbers or punctuation.
             */
            if (
                /^[0-9.\-–—]+$/.test(cleaned) ||
                /^\d+$/.test(cleaned)
            ) {
                continue;
            }

            /*
             * Very short OCR fragments.
             */
            if (
                cleaned.length < 8
            ) {
                continue;
            }

            const letters =
                (cleaned.match(/[A-Za-zÑñ]/g) || []).length;

            const digits =
                (cleaned.match(/[0-9]/g) || []).length;

            const symbols =
                (cleaned.match(/[^A-Za-zÑñ0-9\s]/g) || []).length;

            /*
             * Reject lines dominated by OCR/punctuation noise.
             */
            if (
                letters < 5 ||
                (symbols > letters && digits === 0) ||
                (letters < 8 && symbols > 3)
            ) {
                continue;
            }

            /*
             * Reject lines with an unusually high proportion
             * of punctuation/non-word characters. This catches
             * OCR fragments such as ":,:~: 6& !" and "'".
             */
            const totalVisible =
                letters +
                digits +
                symbols;

            if (
                totalVisible > 0 &&
                symbols >= 5 &&
                symbols >= letters
            ) {
                continue;
            }

            /*
             * Proclamation source candidates must pass the same
             * title-quality validator used for stored titles.
             * This prevents OCR/header text from being returned
             * as the recovered document description.
             */
            if (
                type === "Proclamation" &&
                isBadProclamationTitle(cleaned)
            ) {
                continue;
            }

            /*
             * Reject extremely short one-word fragments that are
             * clearly not descriptive legal titles.
             */
            const words =
                headerCheck
                    .split(/\s+/)
                    .filter(function (word) {
                        return word.length > 0;
                    });

            if (
                words.length === 1 &&
                letters < 12
            ) {
                continue;
            }

            /*
             * Proclamation source candidates must contain enough
             * normal descriptive language to be a plausible title.
             * This rejects OCR/header fragments such as:
             * BYtHE~PRESlDE"'T, MALA... and punctuation-only noise.
             */
            if (type === "Proclamation") {

                const proclamationCandidate =
                    cleaned
                        .replace(/\\s+/g, " ")
                        .trim();

                /*
                 * Reject obvious OCR fragments that begin with a date
                 * but do not form a descriptive proclamation title.
                 * Example:
                 * "22 JUNE 1993 AS A SPECIAL DAY THE"
                 *
                 * Legitimate titles such as:
                 * "DECLARING 22 JUNE 1993 AS A SPECIAL DAY..."
                 * are preserved because they contain a descriptive verb.
                 */
                if (
                    /^\d{1,2}\s+(?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{4}\b/i.test(
                        proclamationCandidate
                    ) &&
                    !/\b(?:DECLARING|PROCLAIMING|CREATING|DESIGNATING|RESERVING|AMENDING|EXTENDING|CALLING|APPOINTING|ESTABLISHING)\b/i.test(
                        proclamationCandidate
                    )
                ) {
                    continue;
                }

                const proclamationLetters =
                    (proclamationCandidate.match(/[A-Za-zÑñ]/g) || []).length;

                const proclamationDigits =
                    (proclamationCandidate.match(/[0-9]/g) || []).length;

                const proclamationSymbols =
                    (proclamationCandidate.match(/[^A-Za-zÑñ0-9\\s]/g) || []).length;

                const proclamationWords =
                    proclamationCandidate
                        .split(/\\s+/)
                        .filter(function (word) {
                            return word.length > 0;
                        });

                const proclamationAlphaRatio =
                    proclamationCandidate.length > 0
                        ? proclamationLetters / proclamationCandidate.length
                        : 0;

                if (
                    proclamationLetters < 10 ||
                    proclamationAlphaRatio < 0.55 ||
                    (
                        proclamationSymbols >= 3 &&
                        proclamationSymbols >= proclamationLetters
                    ) ||
                    (
                        proclamationDigits > 0 &&
                        proclamationDigits >= proclamationLetters
                    ) ||
                    (
                        proclamationWords.length <= 2 &&
                        proclamationLetters < 18
                    )
                ) {
                    continue;
                }
            }

            /*
             * Final Proclamation fragment guard.
             *
             * OCR can produce readable-looking fragments from
             * the middle of a title. These must not become the
             * displayed description.
             */
            if (type === "Proclamation") {
                const proclamationText =
                    cleaned
                        .replace(/\\s+/g, " ")
                        .trim();

                const proclamationUpper =
                    proclamationText.toUpperCase();

                const hasDescriptiveVerb =
                    /\\b(?:DECLARING|PROCLAIMING|CREATING|DESIGNATING|RESERVING|AMENDING|EXTENDING|CALLING|APPOINTING|ESTABLISHING|RECOGNIZING|AUTHORIZING|DIRECTING|ORDERING|SETTING|NAMING|CONVERTING|TRANSFERRING|GRANTING|CELEBRATING)\\b/.test(
                        proclamationUpper
                    );

                const startsWithFragment =
                    /^(?:AY|Y|THE|OF|IN|FOR|AS|TO|A|AN|ON|BY|DAY|MARKS|ANNIVERSARY|FOUNDING)\\b/i.test(
                        proclamationText
                    );

                if (
                    startsWithFragment &&
                    !hasDescriptiveVerb
                ) {
                    continue;
                }
            }

            /*
             * Court Issuance source-candidate filter.
             *
             * The source fallback can contain index headings,
             * OCR headers, or ordinary body paragraphs. These are
             * not document descriptions and must not become card
             * titles.
             */
            if (type === "Court Issuance") {

                const courtCandidate =
                    cleaned
                        .replace(/\\s+/g, " ")
                        .trim();

                const courtCheck =
                    courtCandidate
                        .replace(/[^A-Za-zÑñ0-9]+/g, " ")
                        .replace(/\\s+/g, " ")
                        .trim()
                        .toUpperCase();

                const courtCompact =
                    courtCheck.replace(/\\s+/g, "");

                /*
                 * Known index/category headings.
                 */
                if (
                    /^(?:MEMORANDUM CIRCULARS|MEMORANDUM ORDERS|REVISED SUPREME COURT CIRCULARS|SUPREME COURT CIRCULARS|ADMINISTRATIVE ORDERS|ADMINISTRATIVE CIRCULARS|REVISED ADMINISTRATIVE CIRCULARS|ADMINISTRATIVE SUPERVISION OF COURTS CIRCULARS|REVISED ADMINISTRATIVE SUPERVISION OF COURTS CIRCULARS)$/.test(
                        courtCheck
                    )
                ) {
                    continue;
                }

                /*
                 * Institutional/source headers and OCR variants.
                 */
                if (
                    /^REPUBLIC OF THE PHILIPPINES SUPREME COURT MANILA$/.test(
                        courtCheck
                    ) ||
                    /^REPUBLICOFTHEPHILIPPINESSUPREMECOURTMANILA$/.test(
                        courtCompact
                    ) ||
                    /^SUPREME COURT MANILA$/.test(courtCheck) ||
                    /^MANILA$/.test(courtCheck)
                ) {
                    continue;
                }

                /*
                 * OCR-corrupted Philippine-government header.
                 */
                if (
                    /^(?:31|3I|BI)[A-Z]*EPUBLIC OF THE PHILIPPINES$/.test(
                        courtCheck
                    ) ||
                    /^EPUBLIC OF THE PHILIPPINES$/.test(courtCheck) ||
                    /EPUBLICOFTHEPHILIPPINES/.test(courtCompact)
                ) {
                    continue;
                }

                /*
                 * A legal identifier by itself is not a description.
                 */
                if (
                    /^(?:A M|A M NO|G R|G R NO|A C|A C NO|B M|B M NO|B R|B R NO|J|J NO|OCA|OCA NO) [A-Z0-9 .-]+$/.test(
                        courtCheck
                    )
                ) {
                    continue;
                }

                /*
                 * Long sentence-like body text is not a card title.
                 * Keep normal descriptive titles, including longer
                 * all-capital document titles.
                 */
                if (
                    courtCandidate.length > 140 &&
                    /[.!?]/.test(courtCandidate) &&
                    /\\b(?:the|has|have|been|was|were|is|are|of|to|for|with|that|which|this|such|supposedly|authorized|required)\\b/i.test(
                        courtCandidate
                    )
                ) {
                    continue;
                }

                /*
                 * Known body-text opening pattern.
                 */
                if (
                    /^THE ATTENTION OF THE COURT HAS BEEN CALLED\\b/i.test(
                        courtCandidate
                    )
                ) {
                    continue;
                }
            }

            return cleaned;
        }

        return "";
    }

    /*
     * Memorandum Orders:
     * Normalize only clearly valid database numbers.
     *
     * IMPORTANT:
     * Do not reconstruct numbers from OCR text. Article text can mention
     * another Memorandum Order, and OCR can turn letters into digits.
     *
     * Valid examples:
     *   132
     *   1-A
     *   102-A
     *   75-F
     *
     * OCR-damaged numbers are deliberately preserved so that no false
     * legal number is invented.
     *
     * Display-only. The database and article text are unchanged.
     */
    if (type === "Memorandum Order") {
        const memorandumOrderNumber =
            String(law.number || "")
                .trim()
                .replace(/\s+/g, " ");

        const cleanMemorandumOrderNumber =
            /^(?:[0-9]+|[0-9]+-[A-Za-z])$/.test(
                memorandumOrderNumber
            )
                ? memorandumOrderNumber
                : "";

        if (cleanMemorandumOrderNumber) {
            const normalizedMemorandumOrderPrefix =
                "MEMORANDUM ORDER NO. " +
                cleanMemorandumOrderNumber;

            const titleWithoutOldNumber =
                title
                    .replace(
                        /^MEMORANDUM\s*ORDER\s*NO\.?\s*[0-9]+(?:-[A-Za-z])?\s*/i,
                        ""
                    )
                    .trim();

            if (titleWithoutOldNumber) {
                title =
                    normalizedMemorandumOrderPrefix +
                    " " +
                    titleWithoutOldNumber;
            } else {
                title =
                    normalizedMemorandumOrderPrefix;
            }
        }
    }

    /*
     * Remove legal-number prefixes from ordinary database titles.
     * The descriptive portion is retained.
     */
    title =
        decodeDisplayText(title)
            .replace(
                /^\[\s*Act\s+No\.\s*[\w-]+[^\]]*\]\s*/i,
                ""
            )
            .replace(
                /^\s*Act\s+No\.\s*[\w-]+\s*/i,
                ""
            )
            .replace(
                /^\s*EXECUTIVE\s+ORDER\s+NO\.\s*[\w-]+\s*(?:[A-Za-z]+\s+\d{1,2},\s*\d{4})?\s*/i,
                ""
            )
            .replace(
                /^\s*COMMONWEALTH\s+ACT\s+NO\.\s*[\w-]+\s*/i,
                ""
            )
            .replace(
                /^\[\s*COMMONWEALTH\s+ACT\s+NO\.\s*[\w-]+[^\]]*\]\s*/i,
                ""
            )
            .replace(
                /^\s*PRESIDENTIAL\s+DECREE\s+NO\.\s*[\w-]+\s*(?:[A-Za-z]+\s+\d{1,2},\s*\d{4})?\s*/i,
                ""
            )
            .replace(
                /^\s*BATAS\s+PAMBANSA\s+(?:BLG\.?|NO\.)\s*[\w-]+\s*/i,
                ""
            )
            .replace(
                /^\s*ADMINISTRATIVE\s+ORDER\s+NO\.\s*[\w-]+\s*(?:[A-Za-z]+\s+\d{1,2},\s*\d{4})?\s*/i,
                ""
            )
            .replace(
                /^\s*MEMORANDUM\s+CIRCULAR\s+NO\.\s*[\w.-]+\s*(?:[A-Za-z]+\s+\d{1,2},\s*\d{4})?\s*/i,
                ""
            )
            .replace(
                /^\s*MEMORANDUM\s+ORDER\s+NO\.?\s*[\w.-]+\s*(?:[A-Za-z]+\s+\d{1,2},\s*\d{4})?\s*/i,
                function (match) {
                    return type === "Memorandum Order"
                        ? match
                        : "";
                }
            )
            .replace(
                /^\s*PROCLAMATION\s+NO\.?\s*[\w.-]+\s*(?:[A-Za-z]+\s+\d{1,2},\s*\d{4})?\s*/i,
                ""
            )
            .replace(
                /^\s*SPECIAL\s+ORDER\s+NO\.?\s*[\w.-]+\s*(?:Series\s+of\s+\d{4})?\s*/i,
                ""
            )
            .replace(/\s+/g, " ")
            .trim();

    /*
     * Generic/internal titles are replaced by the source
     * description.
     */
    /*
     * A title may become invalid after the legal-number prefix
     * is removed. Treat these cleaned values as generic so the
     * renderer can fall back to the actual descriptive source title.
     */
    const titleHeaderCheck =
        title
            .replace(/[^A-Za-zÑñ]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();

    const titleHeaderCompact =
        titleHeaderCheck
            .replace(/\s+/g, "");

    const titleCompact =
        titleHeaderCompact
            .replace(/[0O]/g, "O")
            .replace(/[1I|]/g, "I")
            .replace(/[5S]/g, "S")
            .replace(/[T7]/g, "T");

    /*
     * Proclamation titles need stricter validation because some
     * source records have OCR/header text stored directly in the
     * title field.
     *
     * Return true when the stored title is clearly NOT a real
     * descriptive proclamation title.
     */
    function isBadProclamationTitle(value) {

        const candidate =
            decodeDisplayText(
                String(value || "")
            )
            .replace(/\s+/g, " ")
            .trim();

        if (!candidate) {
            return true;
        }

        const check =
            candidate
                .replace(/[^A-Za-zÑñ]+/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();

        const compact =
            check.replace(/\s+/g, "");

        const letters =
            (candidate.match(/[A-Za-zÑñ]/g) || []).length;

        const digits =
            (candidate.match(/[0-9]/g) || []).length;

        const symbols =
            (candidate.match(/[^A-Za-zÑñ0-9\s]/g) || []).length;

        const words =
            check
                .split(/\s+/)
                .filter(function (word) {
                    return word.length > 0;
                });

        if (letters < 5) {
            return true;
        }

        if (
            symbols >= 2 &&
            symbols >= letters
        ) {
            return true;
        }

        if (
            digits > 0 &&
            digits >= letters
        ) {
            return true;
        }

        if (
            words.length === 1 &&
            letters < 12
        ) {
            return true;
        }

        if (
            /^BY\s+THE\s+PRESIDENT\b/i.test(check) ||
            /^BY\s+THE\s+GOVERNOR\s+GENERAL\b/i.test(check) ||
            /^BYTHEPRESIDENT/.test(compact) ||
            /^BYTHEGOVERNORGENERAL/.test(compact) ||
            /^MALAC/.test(compact) ||
            /^REPUBLICOFTHEPHILIPPINES/.test(compact) ||
            /^SUPREMECOURT/.test(compact) ||
            /^MANILA$/.test(compact)
        ) {
            return true;
        }

        if (
            /^THE\s+LAWPHIL\s+PROJECT\b/i.test(check) ||
            /^THELAWPHILPROJECT/.test(compact) ||
            /^PROCLAMATIONS?\s+SERIES\s+OF\s+\d{4}$/i.test(candidate) ||
            /^PROCLAMATIONS?SERIESOF\d{4}$/.test(compact)
        ) {
            return true;
        }

        return false;
    }

    const proclamationTitleIsBad =
        type === "Proclamation" &&
        isBadProclamationTitle(title);

    /*
     * A Proclamation with a bad stored title must always enter
     * the recovery path below.  Do not allow the OCR/header
     * title to survive simply because it is non-empty.
     */
    if (proclamationTitleIsBad) {
        title = "";
    }

    /*
     * A Memorandum Order title containing only its legal number is
     * not a descriptive title.  Let the existing article-title
     * recovery below supply the document description.
     *
     * The legal number remains displayed separately by getLawNumber().
     */
    const memorandumOrderTitleIsNumberOnly =
        type === "Memorandum Order" &&
        /^MEMORANDUM\s+ORDER\s+NO\.?\s*[0-9]+(?:-[A-Za-z])?$/i.test(title);

    const memorandumOrderTitleIsComplete =
        type === "Memorandum Order" &&
        /^MEMORANDUM\s+ORDER\s+NO\.?\s*[A-Z0-9]+(?:[.-][A-Z0-9]+)*(?:\s+[A-Za-z]+\s+\d{1,2},\s*\d{4})?$/i.test(title) &&
        !memorandumOrderTitleIsNumberOnly;

    const generic =
        !title ||
        /^DOC-[a-z0-9]+$/i.test(title) ||
        /^(?:PROCLAMATION|MALACA[NÑ]AN|REPUBLIC OF THE PHILIPPINES|SUPREME COURT|MANILA)$/i.test(title) ||
        (
            /^MEMORANDUM\s+(?:CIRCULAR|ORDER)\s+NO\.?/i.test(title) &&
            !memorandumOrderTitleIsComplete
        ) ||
        /^COURT\s+ISSUANCE$/i.test(title) ||
        /^PHILIPPINE\s+LAW$/i.test(title) ||
        /^Series\s+of\s+\d{4}$/i.test(title) ||
        /^[0-9.\-–—]+$/.test(title) ||
        /^\d+$/.test(title) ||
        proclamationTitleIsBad ||
        /^BY THE PRESIDENT(?: OF THE PHILIPPINES)?$/i.test(titleHeaderCheck) ||
        /^BY THE GOVERNOR GENERAL OF THE PHILIPPINE ISLANDS?$/i.test(titleHeaderCheck) ||
        /^BYTHEPRESIDENT(?:OFTHEPHILIPPINES)?$/i.test(titleHeaderCompact) ||
        /^BYTHEPRESIDENT$/i.test(titleHeaderCompact) ||
        /^MALA(?:CA|CAN|CANA|CANA[NÑ]|CANA[NÑ]PALACE|CANA[NÑ]PALACEMANILA)/i.test(titleHeaderCompact);

    /*
     * A Proclamation title that becomes only
     * "Series of YYYY" after removing its legal identifier
     * is not a descriptive title. Clear it so the existing
     * source-text fallback can recover the actual title.
     */
    if (
        type === "Proclamation" &&
        /^Series\s+of\s+\d{4}$/i.test(title)
    ) {
        title = "";
    }

    if (generic && type !== "Court Issuance") {

        /*
         * The repaired legal records may store the actual
         * document description in the first provision title.
         *
         * For Proclamations, however, some provision titles are
         * OCR/header noise such as:
         *   "3"
         *   "Series of 1935"
         *   "BY THE PRESIDENT..."
         *   "MALACAÑAN..."
         *
         * Apply the same source-quality filter before accepting
         * a provision title.
         */
        for (const article of lawArticles) {

            const articleTitle =
                decodeDisplayText(
                    String(
                        article &&
                        article.title ||
                        ""
                    )
                )
                .replace(/\s+/g, " ")
                .trim();

            if (!articleTitle) {
                continue;
            }

            if (
                /^(?:section|article|chapter|part|title|division)\b/i.test(
                    articleTitle
                )
            ) {
                continue;
            }

            const articleHeaderCheck =
                articleTitle
                    .replace(/[^A-Za-zÑñ]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toUpperCase();

            const articleHeaderCompact =
                articleHeaderCheck
                    .replace(/\s+/g, "");

            if (
                /^(?:REPUBLIC OF THE PHILIPPINES|SUPREME COURT|MALACAÑAN|MALACANANG|MALACAÑAN PALACE|MALACANANG PALACE|MANILA|PHILIPPINES|PHILIPPINE)$/i
                    .test(articleHeaderCheck)
            ) {
                continue;
            }

            if (
                /^MALA(?:CA|CAN|CANA|CANA[NÑ]|CANA[NÑ]PALACE|CANA[NÑ]PALACEMANILA)/i
                    .test(articleHeaderCompact)
            ) {
                continue;
            }

            if (
                /^BY THE PRESIDENT(?: OF THE PHILIPPINES)?$/i.test(articleHeaderCheck) ||
                /^BY THE GOVERNOR GENERAL OF THE PHILIPPINE ISLANDS?$/i.test(articleHeaderCheck) ||
                /^BY THE PRESIDENT$/i.test(articleHeaderCheck)
            ) {
                continue;
            }

            if (
                /^BYTHEPRESIDENT(?:OFTHEPHILIPPINES)?$/i.test(articleHeaderCompact) ||
                /^BYTHEGOVERNORGENERALOF THEPHILIPPINEISLANDS?$/i.test(
                    articleHeaderCheck.replace(/\s+/g, "")
                ) ||
                /^BYTHEPRESIDENT$/i.test(articleHeaderCompact)
            ) {
                continue;
            }

            const articleByPresidentCompact =
                articleHeaderCompact
                    .replace(/0/g, "O")
                    .replace(/1/g, "I")
                    .replace(/5/g, "S");

            if (
                /^BYTHEPRES[I1]DENTOFTHEPH[I1]L[I1]PP[I1]NES$/.test(
                    articleByPresidentCompact
                ) ||
                /^BYTHEPRES[I1]DENT$/.test(
                    articleByPresidentCompact
                )
            ) {
                continue;
            }

            if (
                /^PROCLAMATION\s+NO\.?\s*[\w-]+\s+SERIES\s+OF\s+\d{4}$/i.test(
                    articleTitle
                ) ||
                /^Series\s+of\s+\d{4}$/i.test(
                    articleTitle
                )
            ) {
                continue;
            }

            if (
                /^(?:PROCLAMATION|ADMINISTRATIVE\s+ORDER|MEMORANDUM\s+CIRCULAR|MEMORANDUM\s+ORDER|SPECIAL\s+ORDER)\s+NO\.?/i
                    .test(articleTitle)
            ) {
                continue;
            }

            if (
                /^[0-9.\-–—]+$/.test(articleTitle) ||
                /^\d+$/.test(articleTitle)
            ) {
                continue;
            }

            if (
                articleTitle.length < 8
            ) {
                continue;
            }

            /*
             * Proclamation-specific OCR/title quality filter.
             * Reject short fragments, punctuation-heavy OCR,
             * issuing/header lines, and obvious corrupted
             * Malacañan / presidential text before accepting the
             * candidate as the document description.
             */
            const articleLetters =
                (articleTitle.match(/[A-Za-zÑñ]/g) || []).length;

            const articleDigits =
                (articleTitle.match(/[0-9]/g) || []).length;

            const articleSymbols =
                (articleTitle.match(/[^A-Za-zÑñ0-9\s]/g) || []).length;

            /*
             * Reject OCR/header fragments before accepting an
             * article title as the document description.
             */
            const articleWords =
                articleHeaderCheck
                    .split(/\s+/)
                    .filter(function (word) {
                        return word.length > 0;
                    });

            if (
                articleLetters < 5 ||
                (articleSymbols > articleLetters && articleDigits === 0) ||
                (articleLetters < 8 && articleSymbols > 3)
            ) {
                continue;
            }

            /*
             * Single-character and punctuation-heavy OCR fragments
             * are never useful legal titles.
             */
            if (
                articleTitle.length < 8 ||
                articleLetters < 8 ||
                (
                    articleSymbols >= 2 &&
                    articleSymbols >= articleLetters
                )
            ) {
                continue;
            }

            /*
             * Proclamation-specific OCR/title quality filter.
             *
             * This runs only after articleWords, articleLetters,
             * articleDigits, and articleSymbols have been created.
             */
            if (type === "Proclamation") {

                const proclamationCompact =
                    articleHeaderCompact
                        .replace(/[0O]/g, "O")
                        .replace(/[1I|]/g, "I")
                        .replace(/[5S]/g, "S")
                        .replace(/[T7]/g, "T")
                        .replace(/[^A-Z]/g, "");

                const proclamationLetters =
                    articleLetters;

                const proclamationDigits =
                    articleDigits;

                const proclamationSymbols =
                    articleSymbols;

                if (
                    proclamationLetters < 8 ||
                    proclamationLetters < proclamationDigits ||
                    proclamationSymbols > proclamationLetters ||
                    (
                        articleWords.length <= 2 &&
                        proclamationLetters < 15
                    )
                ) {
                    continue;
                }

                /*
                 * Reject normal and OCR-corrupted issuing lines.
                 */
                if (
                    /^BYTHEPRESIDENT/.test(proclamationCompact) ||
                    /^BYTHEGOVERNORGENERAL/.test(proclamationCompact) ||
                    /^MALAC/.test(proclamationCompact) ||
                    /^REPUBLICOFTHEPHILIPPINES/.test(proclamationCompact) ||
                    /^SUPREMECOURT/.test(proclamationCompact) ||
                    /^MANILA$/.test(proclamationCompact)
                ) {
                    continue;
                }

                /*
                 * Reject Lawphil index/page titles and series labels.
                 */
                if (
                    /^(?:THELAWPHILPROJECT|PROCLAMATIONS?SERIESOF)/i.test(
                        proclamationCompact
                    )
                ) {
                    continue;
                }

                /*
                 * Reject very short OCR fragments even when they
                 * contain enough letters to pass the basic test.
                 */
                if (
                    articleWords.length <= 3 &&
                    proclamationLetters < 20
                ) {
                    continue;
                }
            }

            /*
             * Standalone or nearly-standalone OCR noise.
             */
            if (
                articleWords.length === 1 &&
                articleLetters < 12
            ) {
                continue;
            }

            /*
             * Issuing/header lines with OCR corruption.
             * Normalize common OCR substitutions before testing.
             */
            const articleIssuingCheck =
                articleHeaderCompact
                    .replace(/[0O]/g, "O")
                    .replace(/[1I|]/g, "I")
                    .replace(/[5S]/g, "S")
                    .replace(/[T7]/g, "T")
                    .replace(/[^A-Z]/g, "");

            if (
                /^BYTHEPRESIDENT/.test(articleIssuingCheck) ||
                /^BYTHEGOVERNORGENERAL/.test(articleIssuingCheck) ||
                /^MALAC/.test(articleIssuingCheck)
            ) {
                continue;
            }

            /*
             * Court Issuance article-title filter.
             *
             * Court article titles are selected from repaired provision
             * titles. Reject signatures, names, institutional headers,
             * administrative labels, body-text fragments, and other
             * non-descriptive source lines.
             */
            if (type === "Court Issuance") {

                const courtArticleTitle =
                    articleTitle
                        .replace(/\s+/g, " ")
                        .trim();

                const courtUpper =
                    courtArticleTitle.toUpperCase();

                const courtLetters =
                    (courtArticleTitle.match(/[A-Za-zÑñ]/g) || []).length;

                const courtWords =
                    courtArticleTitle
                        .split(/\s+/)
                        .filter(Boolean);

                if (
                    /^(?:HON\.?|JUSTICE|CHIEF JUSTICE|ASSOCIATE JUSTICE)\b/i.test(
                        courtArticleTitle
                    ) ||
                    /\b(?:ASSOCIATE JUSTICE|CHIEF JUSTICE),?\s+SUPREME COURT\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^\(?\s*SGD\.?\s*\)?\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^(?:DAVIDE|BELLOSILLO|PUNO|VITUG|MENDOZA|PANGANIBAN|QUISUMBING|CARPIO|YNARES-SANTIAGO|PERALTA)\s*,/i.test(
                        courtArticleTitle
                    ) ||
                    /^(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+DIVISION$/i.test(
                        courtArticleTitle
                    ) ||
                    /^MEMORANDUM\s+CIRCULARS?$/i.test(
                        courtArticleTitle
                    ) ||
                    /^MEMORANDUM\s+ORDERS?$/i.test(
                        courtArticleTitle
                    ) ||
                    /^ADMINISTRATIVE\s+(?:ORDER|ORDERS|CIRCULAR|CIRCULARS)$/i.test(
                        courtArticleTitle
                    ) ||
                    /^SUPREME\s+COURT\s+CIRCULARS?(?:\s+AND\s+ORDERS?)?$/i.test(
                        courtArticleTitle
                    ) ||
                    /^REVISED\s+SUPREME\s+COURT\s+CIRCULARS?$/i.test(
                        courtArticleTitle
                    ) ||
                    /^PHILIPPINE\s+LAW$/i.test(
                        courtArticleTitle
                    ) ||
                    /^REPUBLIC\s+OF\s+THE\s+PHILIPPINES$/i.test(
                        courtArticleTitle
                    ) ||
                    /^SUPREME\s+COURT(?:\s+OF\s+THE\s+PHILIPPINES)?$/i.test(
                        courtArticleTitle
                    ) ||
                    /^MANILA$/i.test(
                        courtArticleTitle
                    ) ||
                    /^(?:31\.?\s*)?[^A-Za-zÑñ]{0,6}epublic\s+of\s+the/i.test(
                        courtArticleTitle
                    ) ||
                    /^RULES?\s+OF\s+COURT$/i.test(
                        courtArticleTitle
                    ) ||
                    /^GENERAL\s+PROVISIONS?$/i.test(
                        courtArticleTitle
                    ) ||
                    /^(?:TO|FROM|SUBJECT|ATTENTION|RE)\s*:/i.test(
                        courtArticleTitle
                    ) ||
                    /^IN\s+RE\s*:/i.test(
                        courtArticleTitle
                    ) ||
                    /^STRICT\s+OBSERVANCE\s+BY\s+ALL\s+CONCERNED\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^THE\s+ATTENTION\s+OF\s+THE\s+COURT\s+HAS\s+BEEN\s+CALLED\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^(?:I\s+HEREBY|DONE\s+IN|SIGNED|SO\s+ORDERED)\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^BY\s+THE\s+(?:PRESIDENT|GOVERNOR[-\s]+GENERAL)\b/i.test(
                        courtArticleTitle
                    ) ||
                    courtWords.length <= 2 && courtLetters < 12 ||
                    courtArticleTitle.length > 180 &&
                    /[.!?]/.test(courtArticleTitle)
                ) {
                    continue;
                }

                /*
                 * A provision title beginning with a legal identifier
                 * is usually another heading rather than the descriptive
                 * title we want on the category card.
                 */
                if (
                    /^(?:A\.?\s*M\.?|G\.?\s*R\.?|A\.?\s*C\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+NO\.?\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^(?:ADMINISTRATIVE|SUPERVISORY|REVISED|SUPREME\s+COURT)?\s*CIRCULAR\s+NO\.?\b/i.test(
                        courtArticleTitle
                    ) ||
                    /^RESOLUTION\s+NO\.?\b/i.test(
                        courtArticleTitle
                    )
                ) {
                    continue;
                }
            }

            if (type !== "Court Issuance") {
                title =
                    articleTitle;

                break;
            }
        }

        if (!title && type !== "Court Issuance") {

            const fallback =
                sourceDescription(rawText);

            if (fallback) {
                title =
                    fallback;
            }
        }
    }

    /*
     * Some repaired records have the useful descriptive title
     * embedded after the legal identifier on the same line.
     */
    if (
        !title &&
        rawText &&
        type !== "Court Issuance"
    ) {

        const firstUseful =
            sourceDescription(rawText);

        if (firstUseful) {
            title =
                firstUseful;
        }
    }

    /*
     * Court Issuances:
     *
     * Recover only a genuine descriptive title. Court source text
     * often contains institutional headers, identifiers, OCR
     * fragments, and body paragraphs before the actual subject.
     */
    if (type === "Court Issuance") {

        const courtIdentifier = getLawNumber(law);
        const currentTitle = String(title || "").trim();

        const isCourtIdentifier = true;

        if (isCourtIdentifier) {

            const courtLines =
                rawText
                    .split(/\r?\n/)
                    .map(function (line) {
                        return decodeDisplayText(String(line || ""))
                            .replace(/\t+/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();
                    })
                    .filter(Boolean);

            let courtDescription = "";

            /*
             * FIRST PRIORITY:
             * SUBJECT: is normally the authoritative descriptive title.
             */
            for (const line of courtLines) {

                const subjectMatch =
                    line.match(/^SUBJECT\s*:\s*(.+)$/i);

                if (!subjectMatch) {
                    continue;
                }

                const candidate =
                    subjectMatch[1]
                        .replace(/\s+/g, " ")
                        .trim();

                const subjectUpper =
                    candidate
                        .replace(/\s+/g, " ")
                        .trim()
                        .toUpperCase();

                const badSubject =
                    /^\(?[A-Z]\s*[.)]\s+/i.test(candidate) ||
                    /^\(?\s*\d+[.)]\s*/i.test(candidate) ||
                    /[.!?;:]$/.test(candidate) ||
                    /^PHILIPPINE LAW$/i.test(candidate) ||
                    /^VERY TRULY YOURS[,.]?$/i.test(candidate) ||
                    /^REPUBLIC OF THE PHILIPPINES$/i.test(candidate) ||
                    /^SUPREME COURT$/i.test(candidate) ||
                    /^COURT OF APPEALS$/i.test(candidate) ||
                    /^MANILA(?:,\s*PHILIPPINES)?$/i.test(candidate) ||
                    /^(?:HON\.?|ATTY\.?|ATTORNEY|MR\.?|MS\.?|MRS\.?|JUSTICE|CHIEF JUSTICE|ASSOCIATE JUSTICE)\b/i.test(candidate) ||
                    /\b(?:CHIEF JUSTICE|ASSOCIATE JUSTICE)\b/i.test(candidate) ||
                    /^\(?\s*(?:SGD\.?|SIGNED)\b/i.test(candidate) ||
                    candidate.length > 180 ||
                    subjectUpper === "GENERAL PROVISIONS" ||
                    subjectUpper === "SPECIAL PROVISIONS" ||
                    subjectUpper === "PRELIMINARY PROVISIONS" ||
                    subjectUpper === "FINAL PROVISIONS" ||
                    subjectUpper === "MISCELLANEOUS PROVISIONS";

                if (
                    candidate.length >= 8 &&
                    /[A-Za-zÑñ]/.test(candidate) &&
                    !/^[-—:]+$/.test(candidate) &&
                    !badSubject
                ) {
                    courtDescription = candidate;
                    break;
                }
            }

            /*
             * SECOND PRIORITY:
             * Rules of Court records commonly place the descriptive
             * title immediately after a RULE heading.
             */
            if (
                !courtDescription &&
                /^RULES\s+OF\s+COURT$/i.test(currentTitle)
            ) {

                for (let i = 0; i < courtLines.length; i++) {

                    if (!/^RULE\s+\d+/i.test(courtLines[i])) {
                        continue;
                    }

                    for (let j = i + 1; j < courtLines.length; j++) {

                        const candidate = courtLines[j];

                        if (
                            /^SECTION\s+\d+/i.test(candidate) ||
                            /^SEC\.\s*\d+/i.test(candidate) ||
                            /^RULE\s+\d+/i.test(candidate)
                        ) {
                            continue;
                        }

                        if (
                            /^(?:REPUBLIC OF THE PHILIPPINES|SUPREME COURT|COURT OF APPEALS|MANILA|PHILIPPINES|EN BANC)$/i.test(candidate)
                        ) {
                            continue;
                        }

                        if (
                            candidate.length >= 8 &&
                            /[A-Za-zÑñ]/.test(candidate)
                        ) {
                            courtDescription = candidate;
                            break;
                        }
                    }

                    if (courtDescription) {
                        break;
                    }
                }
            }

            /*
             * THIRD PRIORITY:
             * Find the first substantive heading after the legal
             * identifier. Never accept institutional headers,
             * metadata, or obvious OCR garbage.
             */
            /*
             * THIRD PRIORITY:
             * Do NOT promote arbitrary body paragraphs, names, signatures,
             * OCR fragments, or correspondence into the card title.
             *
             * Court titles are accepted only from an explicit SUBJECT:
             * line or the Rules-of-Court heading logic above.
             */
            if (!courtDescription) {
                courtDescription = "";
            }

            /*
             * Keep a valid existing descriptive title when the source
             * does not expose a better candidate.
             */
            if (currentTitle) {
                const upperCurrentTitle =
                    currentTitle
                        .replace(/\s+/g, " ")
                        .trim()
                        .toUpperCase();

                const badCurrentCourtTitle =
                    /^DOC-/i.test(currentTitle) ||
                    upperCurrentTitle === "PHILIPPINE LAW" ||
                    upperCurrentTitle.startsWith("THE LAWPHIL PROJECT") ||
                    upperCurrentTitle.startsWith("VICE/WORKING CHAIRPERSON:") ||
                    upperCurrentTitle === "GENERAL PROVISIONS" ||
                    upperCurrentTitle === "SPECIAL PROVISIONS" ||
                    upperCurrentTitle === "PRELIMINARY PROVISIONS" ||
                    upperCurrentTitle === "FINAL PROVISIONS" ||
                    upperCurrentTitle === "MISCELLANEOUS PROVISIONS" ||
                    upperCurrentTitle.startsWith("UPON EXTRA-JUDICIAL PETITION") ||
                    upperCurrentTitle.startsWith("UPON EXTRA JUDICIAL PETITION") ||
                    upperCurrentTitle.startsWith("QUOTED HEREUNDER") ||
                    upperCurrentTitle.startsWith("IN RE:") ||
                    upperCurrentTitle.startsWith("TO:") ||
                    upperCurrentTitle.startsWith("FROM:") ||
                    upperCurrentTitle.startsWith("SUBJECT:") ||
                    /^31\.\\?EPUHLIC\s+OF\s+THE/i.test(upperCurrentTitle) ||
                    /^Y[NÑ]ARES-SANTIAGO,\s+ON\s+LEAVE$/i.test(currentTitle) ||
                    /^(?:A\.?\s*M\.?|G\.?\s*R\.?|A\.?\s*C\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+NO\.?\s*[A-Z0-9-]+(?:\s*\([^)]*\))?$/i.test(currentTitle) ||
                    /^(?:REVISED\s+|SUPERVISORY\s+|ADMINISTRATIVE\s+)?CIRCULAR\s+NO\.?\s*[A-Z0-9-]*(?:\s+.*)?$/i.test(currentTitle) ||
                    /^RULE\s+\d+[A-Z-]*(?:\s*[-—]\s*.*)?$/i.test(currentTitle) ||
                    /^RESOLUTION\s+NO\.?\s*[A-Z0-9-]+$/i.test(currentTitle) ||
                    /^2019\s+AMENDMENTS\s+TO\s+THE(?:\s+1997\s+RULES)?$/i.test(currentTitle) ||
                    currentTitle.length > 180;

                if (!badCurrentCourtTitle) {
                    title = currentTitle;
                }
            }

            if (courtDescription) {
                const upperTitle =
                    String(title || "")
                        .replace(/\s+/g, " ")
                        .trim()
                        .toUpperCase();

                const titleIsIdentifier =
                    !title ||
                    /^(?:A\.?\s*M\.?|G\.?\s*R\.?|A\.?\s*C\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+NO\.?\s*[A-Z0-9-]+/i.test(title) ||
                    /^(?:REVISED\s+|SUPERVISORY\s+|ADMINISTRATIVE\s+)?CIRCULAR\s+NO\.?\s*[A-Z0-9-]*/i.test(title) ||
                    /^RULE\s+\d+/i.test(title) ||
                    /^RESOLUTION\s+NO\.?\s*[A-Z0-9-]+/i.test(title) ||
                    /^2019\s+AMENDMENTS\s+TO\s+THE(?:\s+1997\s+RULES)?$/i.test(title) ||
                    upperTitle === "PHILIPPINE LAW";

                if (titleIsIdentifier) {
                    title = courtDescription;
                }
            }

            if (!title && courtIdentifier) {
                title = courtIdentifier;
            }

            /*
             * Final Court-title cleanup:
             * If the recovered title is still only a legal identifier,
             * use the first substantive source description instead.
             * This keeps the legal number in the number field and
             * prevents identifiers such as "CIRCULAR NO." from being
             * displayed as the descriptive card title.
             */
            if (
                false
            ) {
                const fallbackDescription = sourceDescription(rawText);

                if (fallbackDescription) {
                    const candidate =
                        fallbackDescription
                            .replace(/\s+/g, " ")
                            .trim();

                    const upperCandidate =
                        candidate.toUpperCase();

                    const badCourtTitle =
                        upperCandidate === "PHILIPPINE LAW" ||
                        upperCandidate.startsWith("THE LAWPHIL PROJECT") ||
                        upperCandidate.startsWith("VICE/WORKING CHAIRPERSON:") ||
                        upperCandidate === "GENERAL PROVISIONS" ||
                        upperCandidate === "SPECIAL PROVISIONS" ||
                        upperCandidate === "PRELIMINARY PROVISIONS" ||
                        upperCandidate === "FINAL PROVISIONS" ||
                        upperCandidate === "MISCELLANEOUS PROVISIONS" ||
                        upperCandidate.startsWith("UPON EXTRA-JUDICIAL PETITION") ||
                        upperCandidate.startsWith("UPON EXTRA JUDICIAL PETITION") ||
                        upperCandidate.startsWith("QUOTED HEREUNDER") ||
                        upperCandidate.startsWith("IN RE:") ||
                        upperCandidate.startsWith("TO:") ||
                        upperCandidate.startsWith("FROM:") ||
                        upperCandidate.startsWith("SUBJECT:") ||
                        /^\([A-Za-z]\)\s+/.test(candidate) ||
                        /^(?:JUSTICE|CHIEF JUSTICE|ASSOCIATE JUSTICE)\b/i.test(candidate) ||
                        /^(?:VERY TRULY YOURS|RESPECTFULLY YOURS|YOURS TRULY)[,.]?!?$/i.test(candidate) ||
                        /^(?:REPUBLIC OF THE PHILIPPINES|SUPREME COURT|COURT OF APPEALS|MANILA|PHILIPPINES)$/i.test(candidate) ||
                        /^(?:RULE|SECTION|SEC\.)\s+\d+/i.test(candidate) ||
                        /^\d+(?:[.)]|\s)/.test(candidate) ||
                        /^L[\\/|]?EPUBLIC\s+OF\s+THE/i.test(candidate) ||
                        candidate.length > 180;

                    if (!badCourtTitle) {
                        title = candidate;
                    }
                }
            }
        }
    }

    /*
     * Court source-title fallback.
     * If the current Court title is only an identifier, recover the
     * first substantive heading from the source text.
     */
    if (
        type === "Court Issuance" &&
        (
            !title ||
            /^(?:A\.?\s*M\.?|G\.?\s*R\.?|A\.?\s*C\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+NO\.?\s*[A-Z0-9-]+(?:\s*\([^)]*\))?$/i.test(String(title).trim()) ||
            /^(?:REVISED\s+|SUPERVISORY\s+|ADMINISTRATIVE\s+)?CIRCULAR\s+NO\.?\s*[A-Z0-9-]*$/i.test(String(title).trim()) ||
            /^2019\s+AMENDMENTS\s+TO\s+THE(?:\s+1997\s+RULES)?$/i.test(String(title).trim())
        )
    ) {
        const sourceLines = rawText
            .split(/\r?\n/)
            .map(function (line) {
                return decodeDisplayText(String(line || ""))
                    .replace(/\t+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
            })
            .filter(Boolean);

        for (const line of sourceLines) {
            const candidate = line.replace(/&nbsp;/gi, " ").trim();

            if (
                candidate.length < 15 ||
                candidate.length > 220 ||
                !/[A-Za-zÑñ]/.test(candidate)
            ) continue;

            const upper = candidate.toUpperCase();

            if (
                /^(?:A\.?\s*M\.?|G\.?\s*R\.?|A\.?\s*C\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+NO\.?/i.test(candidate) ||
                /^(?:CIRCULAR|ADMINISTRATIVE CIRCULAR|SUPERVISORY CIRCULAR|RESOLUTION)\s+NO\.?/i.test(candidate) ||
                /^(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+DIVISION$/i.test(candidate) ||
                /^PHILIPPINE\s+JURISPRUDENCE\s*-\s*/i.test(candidate) ||
                upper.includes("REPUBLIC OF THE PHILIPPINES") ||
                upper.includes("SUPREME COURT") ||
                upper === "COURT OF APPEALS" ||
                upper === "MANILA" ||
                upper === "PHILIPPINES" ||
                upper === "EN BANC" ||
                /^WHEREAS\b/i.test(candidate) ||
                /^NOW,\s*THEREFORE\b/i.test(candidate) ||
                /^SECTION\b/i.test(candidate) ||
                /^SEC\.\s*\d+/i.test(candidate) ||
                /^RULE\s+\d+/i.test(candidate) ||
                /^\d+[.)]\s*/.test(candidate) ||
                /^\(?[A-Za-z]\)?[.)]\s*/.test(candidate)
            ) continue;

            title = candidate;
            break;
        }
    }


    if (
        !title &&
        type === "Court Issuance"
    ) {
        const courtRawTitle =
            String(law.title || "")
                .replace(/&#9;/gi, " ")
                .replace(/\\t+/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        const cleanedCourtRawTitle =
            courtRawTitle
                .replace(/^(?:\\\\+>+|>+)\\s*/, "")
                .trim();

        const upperCourtRawTitle =
            cleanedCourtRawTitle.toUpperCase();

        const badCourtDatabaseTitle =
            !cleanedCourtRawTitle ||
            /^DOC-/i.test(cleanedCourtRawTitle) ||
            /^PHILIPPINE LAW$/i.test(cleanedCourtRawTitle) ||
            /^\\d+\\.\\s*\\\\?EPUHBLIC\\s+OF\\s+THE/i.test(cleanedCourtRawTitle) ||
            /^31\\.\\s*\\\\?EPUHBLIC\\s+OF\\s+THE/i.test(cleanedCourtRawTitle) ||
            upperCourtRawTitle === "CIRCULAR NO." ||
            upperCourtRawTitle === "ADMINISTRATIVE CIRCULAR NO.";

        if (!badCourtDatabaseTitle) {
            title = cleanedCourtRawTitle;
        }
    }

    return (
        title ||
        "Philippine Law"
    );
}

function getLawNumber(law) {

    if (!law) {
        return "";
    }

    const type =
        normalizeCategory(law.type || "");

    const rawNumber =
        String(law.number || "").trim();

    const rawTitle =
        String(law.title || "").trim();

    const rawText =
        String(law.text || "").trim();

    const source =
        rawTitle + "\n" + rawText;

    /*
     * These categories already have reliable public identifiers
     * in law.number. Preserve them exactly.
     */
    if (
        type === "Act" ||
        type === "Republic Act" ||
        type === "Commonwealth Act" ||
        type === "Presidential Decree" ||
        type === "Batas Pambansa" ||
        type === "Executive Order"
    ) {
        return rawNumber;
    }

    /*
     * Administrative Orders.
     *
     * law.number is the authoritative identifier for the record.
     * Do NOT extract the number from the title because an AO title
     * can legitimately mention a different Administrative Order.
     *
     * Preserve leading zeroes such as 01.
     */
    if (type === "Administrative Order") {

        if (
            rawNumber &&
            !/^DOC-/i.test(rawNumber)
        ) {
            const cleanNumber =
                rawNumber.replace(/\s+/g, " ").trim();

            if (
                /^[0-9]{1,6}[A-Z]?(?:-[A-Z])?$/i.test(
                    cleanNumber
                )
            ) {
                let result =
                    "ADMINISTRATIVE ORDER NO. " +
                    cleanNumber;

                /*
                 * Many Administrative Orders share the same
                 * number across different years. When the record
                 * ID ends in a 4-digit year, show that year so
                 * the identifier is unambiguous.
                 *
                 * Example:
                 * administrative-order-no-1-1936
                 * -> ADMINISTRATIVE ORDER NO. 1 — 1936
                 *
                 * IDs without a year remain unchanged.
                 */
                const lawId =
                    String(law.id || "").trim();

                const yearMatch =
                    lawId.match(/-(\d{4})$/);

                if (yearMatch) {
                    result +=
                        " — " +
                        yearMatch[1];
                }

                return result;
            }
        }

        /*
         * Fall back to the source only when law.number is not
         * usable. This keeps the detailed-law view functional.
         */
        const match =
            source.match(
                /ADMINISTRATIVE\s+ORDER\s+NO\.?\s*([0-9]{1,6}[A-Z]?)/i
            );

        if (match) {
            return "ADMINISTRATIVE ORDER NO. " + match[1];
        }

        return "";
    }

    /*
     * Court Issuances.
     *
     * law.number is the authoritative identifier when it is
     * available. Preserve the original Supreme Court format,
     * including A.M., G.R., A.C., B.M., B.R., J., OCA, and
     * Circular identifiers.
     */
    if (type === "Court Issuance") {

        if (
            rawNumber &&
            !/^DOC-/i.test(rawNumber)
        ) {
            return rawNumber
                .replace(/\s+/g, " ")
                .trim();
        }

        /*
         * Court records currently use DOC-... in law.number.
         * The real Supreme Court identifier is in the title/source,
         * e.g. A.M. No. 99-12-08-SC.
         */
        const courtMatch =
            source.match(
                /((?:A\.\s*M\.|A\.M\.|G\.R\.|A\.C\.|B\.M\.|B\.R\.|J\.|OCA)\s+No\.\s*[A-Za-z0-9-]+)/i
            );

        if (courtMatch) {
            return courtMatch[1]
                .replace(/\s+/g, " ")
                .trim();
        }

        const circularMatch =
            source.match(
                /((?:REVISED\s+|SUPERVISORY\s+|ADMINISTRATIVE\s+)?CIRCULAR\s+NO\.?\s*[A-Za-z0-9-]+)/i
            );

        if (circularMatch) {
            return circularMatch[1]
                .replace(/\s+/g, " ")
                .trim();
        }

        return "";
    }

    /*
     * Memorandum Circulars.
     */
    if (type === "Memorandum Circular") {

        const match =
            source.match(
                /MEMORANDUM\s+CIRCULAR\s+NO\.?\s*([0-9]{1,6}[A-Z]?)/i
            );

        if (match) {
            return "MEMORANDUM CIRCULAR NO. " + match[1];
        }

        return "";
    }

    /*
     * Memorandum Orders.
     */
    if (type === "Memorandum Order") {

        const match =
            source.match(
                /MEMORANDUM\s+ORDER\s+NO\.?\s*([0-9]{1,6}[A-Z]?)/i
            );

        if (match) {
            return "MEMORANDUM ORDER NO. " + match[1];
        }

        return "";
    }

    /*
     * Proclamations.
     *
     * law.number is the authoritative identifier.
     * Keep the corrected database value, but restore the
     * normal display label used by the Proclamation cards.
     */
    if (type === "Proclamation") {

        if (
            rawNumber &&
            !/^DOC-/i.test(rawNumber)
        ) {
            return "PROCLAMATION NO. " +
                rawNumber
                    .replace(/\s+/g, " ")
                    .trim();
        }

        const match =
            source.match(
                /PROCLAMATION\s+NO\.?\s*([0-9]{1,6}[A-Z]?(?:-[A-Z])?)/i
            );

        if (match) {
            return "PROCLAMATION NO. " + match[1];
        }

        return "";
    }

    /*
     * Special Orders.
     */
    if (type === "Special Order") {

        const match =
            source.match(
                /SPECIAL\s+ORDER\s+NO\.?\s*([0-9]{1,6}[A-Z]?)/i
            );

        if (match) {
            return "SPECIAL ORDER NO. " + match[1];
        }

        return "";
    }

    /*
     * Court Issuances use DOC-... internally, so never display
     * that value as the legal identifier.
     *
     * Prefer the most recognizable legal heading found in the
     * title/source.
     */
    if (type === "Court Issuance") {

        const patterns = [
            /A\.\s*M\.\s*No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /CIRCULAR\s+NO\.?\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /SUPERVISORY\s+CIRCULAR\s+NO\.?\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /RESOLUTION\s+NO\.?\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /RULES\s+OF\s+COURT/i
        ];

        for (const pattern of patterns) {

            const match = source.match(pattern);

            if (match) {

                const value =
                    match[0]
                        .replace(/\s+/g, " ")
                        .trim();

                return value;
            }
        }

        if (
            rawTitle &&
            !/^DOC-/i.test(rawTitle)
        ) {
            return rawTitle;
        }

        return "";
    }

    /*
     * Jurisprudence.
     *
     * law.number is an internal sequence and must never be used
     * as the public case identifier.
     */
    if (type === "Jurisprudence") {

        const patterns = [
            /G\.R\.\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /A\.C\.\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /A\.M\.\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /B\.M\.\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /B\.R\.\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /J\.\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /OCA\s+No\.\s*[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /U\.?\s*D\.?\s*K\.?\s+(?:No\.?\s*)?[A-Z0-9][A-Z0-9 .\/-]{0,80}/i,
            /U\.?\s*N\.?\s*D\.?\s+(?:Nos?\.?\s*)?[A-Z0-9][A-Z0-9 .\/-]{0,80}/i
        ];

        for (const pattern of patterns) {

            const match = source.match(pattern);

            if (match) {

                return match[0]
                    .replace(/\s+/g, " ")
                    .trim();
            }
        }

        return "";
    }

    /*
     * Other Issuances have mixed document types. Extract the
     * actual identifier rather than exposing DOC-... IDs.
     */
    if (type === "Other Issuance") {

        const patterns = [
            /MUSLIM\s+MINDANAO\s+AUTONOMY\s+ACT\s+NO\.?\s*[0-9]{1,6}/i,
            /REGIONAL\s+ASSEMBLY\s+BILL\s+NO\.?\s*[0-9]{1,6}/i,
            /RLA\s+BILL\s+NO\.?\s*[0-9]{1,6}/i,
            /COMELEC\s+RESOLUTION\s+NO\.?\s*[0-9]{1,6}/i,
            /RESOLUTION\s+NO\.?\s*[0-9]{1,6}/i
        ];

        for (const pattern of patterns) {

            const match = source.match(pattern);

            if (match) {

                return match[0]
                    .replace(/\s+/g, " ")
                    .trim();
            }
        }

        if (
            rawTitle &&
            !/^DOC-/i.test(rawTitle)
        ) {
            return rawTitle;
        }

        return "";
    }

    return rawNumber;
}


function getArticles(law) {

    if (!law) {
        return [];
    }

    if (
        Array.isArray(law.articles) &&
        law.articles.length > 0
    ) {
        return law.articles;
    }

    const fullText =
        String(
            law.text ||
            ""
        ).trim();

    if (fullText) {

        return [
            {
                number: "Full Text",
                title: "",
                text: fullText,
                unit_type: "Document"
            }
        ];
    }

    return [];
}


function getCategories() {
    const categories = [];

    const seen = new Set();

    laws.forEach(function (law) {

        let category = law.type || "Other";

        category =
            String(category)
                .trim();

        if (!category) {
            category = "Other";
        }

        if (!seen.has(category)) {
            seen.add(category);
            categories.push(category);
        }
    });

    return categories.sort(function (a, b) {
        return a.localeCompare(b);
    });
}


function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   CATEGORY NORMALIZATION
   ========================================================= */

function normalizeCategory(value) {

    let category =
        String(value || "")
            .trim()
            .toLowerCase();

    category =
        category
            .replace(/[._-]+/g, " ")
            .replace(/\\s+/g, " ")
            .trim();

    if (
        category === "republic act" ||
        category === "republic acts" ||
        category.startsWith("republic act ")
    ) {
        return "Republic Act";
    }

    if (
        category === "commonwealth act" ||
        category === "commonwealth acts" ||
        category.startsWith("commonwealth act ")
    ) {
        return "Commonwealth Act";
    }

    if (
        category === "presidential decree" ||
        category === "presidential decrees" ||
        category.startsWith("presidential decree ")
    ) {
        return "Presidential Decree";
    }

    if (
        category === "executive order" ||
        category === "executive orders" ||
        category.startsWith("executive order ")
    ) {
        return "Executive Order";
    }

    if (
        category === "batas pambansa" ||
        category === "batas pambansa blg" ||
        category.startsWith("batas pambansa ")
    ) {
        return "Batas Pambansa";
    }

    if (
        category === "constitution" ||
        category === "constitutions"
    ) {
        return "Constitution";
    }

    if (
        category === "code" ||
        category === "codes"
    ) {
        return "Code";
    }

    if (
        category === "act" ||
        category === "acts"
    ) {
        return "Act";
    }

    if (
        category === "administrative order" ||
        category === "administrative orders"
    ) {
        return "Administrative Order";
    }

    if (
        category === "court issuance" ||
        category === "court issuances"
    ) {
        return "Court Issuance";
    }

    if (category === "jurisprudence") {
        return "Jurisprudence";
    }

    if (
        category === "memorandum circular" ||
        category === "memorandum circulars"
    ) {
        return "Memorandum Circular";
    }

    if (
        category === "memorandum order" ||
        category === "memorandum orders"
    ) {
        return "Memorandum Order";
    }

    if (
        category === "other issuance" ||
        category === "other issuances"
    ) {
        return "Other Issuance";
    }

    if (
        category === "proclamation" ||
        category === "proclamations"
    ) {
        return "Proclamation";
    }

    if (
        category === "special order" ||
        category === "special orders"
    ) {
        return "Special Order";
    }

    return String(value || "")
        .trim();
}

function getNumericLawNumber(law) {

    if (!law) {
        return Number.MAX_SAFE_INTEGER;
    }

    const displayNumber =
        String(
            getLawNumber(law) ||
            ""
        ).trim();

    /*
     * Extract the number belonging to the legal identifier.
     * This deliberately ignores years and internal DOC IDs.
     */
    const patterns = [
        /(?:ADMINISTRATIVE\s+ORDER|MEMORANDUM\s+CIRCULAR|MEMORANDUM\s+ORDER|PROCLAMATION|SPECIAL\s+ORDER)\s+NO\.?\s*([0-9]+)/i,
        /(?:ACT|REPUBLIC\s+ACT|COMMONWEALTH\s+ACT|PRESIDENTIAL\s+DECREE)\s+NO\.?\s*([0-9]+)/i,
        /(?:BATAS\s+PAMBANSA)\s+(?:BLG\.?|NO\.)\s*([0-9]+)/i,
        /(?:A\.M\.|A\.C\.|G\.R\.|B\.M\.|B\.R\.|J\.|OCA)\s+No\.?\s*([0-9]+)/i,
        /(?:RESOLUTION|CIRCULAR)\s+NO\.?\s*([0-9]+)/i,
        /(?:BILL|ACT)\s+NO\.?\s*([0-9]+)/i,
        /\b([0-9]{1,6})\b/
    ];

    for (const pattern of patterns) {

        const match =
            displayNumber.match(pattern);

        if (match) {
            return parseInt(match[1], 10);
        }
    }

    return Number.MAX_SAFE_INTEGER;
}


/* =========================================================
   LOAD DATA
   ========================================================= */

if (!window.philippineLawsAPI) {
    console.error("PHILIPPINE LAWS SQLITE API NOT AVAILABLE.");
} else {
    window.philippineLawsAPI.getCategories()
        .then(function (categories) {
            console.log("SQLite categories available:", categories.length);
            showCategories();
        })
        .catch(function (error) {
            console.error("FAILED TO LOAD LAW CATEGORIES:", error);

            if (categoryList) {
                categoryList.innerHTML =
                    '<div style="padding:20px;color:#b00020;">' +
                    '<strong>Unable to load Philippine Laws.</strong><br><br>' +
                    escapeHtml(error.message || String(error)) +
                    '</div>';
            }
        });
}


/* =========================================================
   STARTUP TIMING DIAGNOSTIC
   ========================================================= */

console.time("APP STARTUP TOTAL");


/* =========================================================
   CATEGORY VIEW
   ========================================================= */

function showCategories() {

    selectedCategory = null;
    selectedLaw = null;
    selectedArticleNumber = null;

    /*
     * Make sure the main browsing container is visible
     * whenever Home/Categories is shown.
     */
    if (browseView) {
        browseView.classList.remove("hidden");
    }

    if (categoryView) {
        categoryView.classList.remove("hidden");
    }

    if (lawView) {
        lawView.classList.add("hidden");
    }

    if (selectedLawView) {
        selectedLawView.classList.add("hidden");
    }

    if (articleView) {
        articleView.classList.add("hidden");
    }

    if (!categoryList) {
        console.error(
            "categoryList element not found."
        );
        return;
    }

    categoryList.innerHTML = "";

    /*
     * V1 FINAL CATEGORY LIST
     *
     * These names must exactly match
     * the "type" values in laws.json.
     */
    const categories = [
        "Acts",
        "Administrative Orders",
        "Batas Pambansa",
        "Codes",
        "Commonwealth Acts",
        "Constitution",
        "Court Issuances",
        "Executive Orders",
        "Jurisprudence",
        "Memorandum Circulars",
        "Memorandum Orders",
        "Other Issuances",
        "Presidential Decrees",
        "Proclamations",
        "Republic Acts",
        "Special Orders"
    ];

    const categoryIcons = {
        "Act": "📜",
        "Code": "⚖️",
        "Constitution": "🇵🇭",
        "Executive Order": "📋",
        "Republic Act": "📕",
        "Commonwealth Act": "📜",
        "Presidential Decree": "📜",
        "Batas Pambansa": "📜"
    };

    categories.forEach(function (category) {

        const button =
            document.createElement("button");

        button.className =
            "category-button";

        button.innerHTML =
            '<span class="category-content">' +
                '<span class="category-name">' +
                    escapeHtml(category) +
                '</span>' +
            '</span>' +
            '<span class="category-arrow">→</span>';

        button.addEventListener(
            "click",
            function () {
                showLaws(category);
            }
        );

        categoryList.appendChild(button);
    });
}


/* =========================================================
   LAW LIST
   ========================================================= */

function showLaws(category) {

    selectedCategory = category;
    selectedLaw = null;
    selectedArticleNumber = null;

    if (categoryView) {
        categoryView.classList.add("hidden");
    }

    if (lawView) {
        lawView.classList.remove("hidden");
    }

    if (selectedLawView) {
        selectedLawView.classList.add("hidden");
    }

    if (articleView) {
        articleView.classList.add("hidden");
    }

    if (lawCategoryTitle) {
        lawCategoryTitle.textContent = category;
    }

    if (!lawList) {
        console.error("lawList element not found.");
        return;
    }

    lawList.innerHTML =
        '<div style="padding:20px;">Loading laws...</div>';

    if (!window.philippineLawsAPI) {
        console.error("PHILIPPINE LAWS SQLITE API NOT AVAILABLE.");
        lawList.innerHTML =
            '<div style="padding:20px;color:#b00020;">' +
            "<strong>SQLite law database is unavailable.</strong>" +
            "</div>";
        return;
    }

    const selectedType = normalizeCategory(category);

    window.philippineLawsAPI
        .getLawsByType(selectedType)
        .then(function (categoryLaws) {

            if (!Array.isArray(categoryLaws)) {
                throw new Error(
                    "SQLite returned an invalid law list."
                );
            }

            /*
             * Hide confirmed Lawphil index/directory pages from
             * Court Issuances. Their underlying SQLite records are
             * preserved.
             *
             * Verified:
             * - Memorandum Circulars index (empty record)
             * - Supreme Court Directory
             * - Supreme Court of the Philippines
             * - Supreme Court Circulars
             * - Supreme Court Rules and Issuances
             */
            if (selectedType === "Court Issuance") {
                const hiddenCourtIndexes = new Set([
                    "court-issuance-doc-4ebc8a9332ab71b6c28964a2",

                    "court-issuance-doc-f85954ee56d9e2ee66e7282e",

                "court-issuance-doc-8f38b3e16b049424f937ba25",
                "court-issuance-doc-96420b7aab1185815401ac28",
                "court-issuance-doc-cff7319e4e68503f63f84f91",

                    "court-issuance-doc-0d77d5a3fd0852e327c058a2",
                    "court-issuance-doc-652c892d010cdd275b008390",
                    "court-issuance-doc-6a474eeb8b4cd9c1d73bc656",
                    "court-issuance-doc-c5e9a750fc43345bdc937895",
                    "court-issuance-doc-f8f3c3833119caa8e6bee858",
                    "court-issuance-doc-e464848dcfb579a323c03d1d",
                    "court-issuance-doc-e02c71b524344917a20e9392",
                    "court-issuance-doc-623abcced799e743760c6cfc",
                    "court-issuance-doc-6135568492bc3c5579a1845c",
                    "court-issuance-doc-63b93aa6a25c6f6b84922d26",
                    "court-issuance-doc-2f1c67890cbb9a22e9606e27",
                    "court-issuance-doc-25158b30d0d3a19b44b3bf27",
                    "court-issuance-doc-67e4e0ce860a6abd88557af1",
                    "court-issuance-doc-c4fd8e2f231a65afb7fe5a80"
                ]);

                categoryLaws = categoryLaws.filter(function (law) {
                    return !hiddenCourtIndexes.has(
                        String(law.id || "")
                    );
                });
            }

            /*
             * Hide one known imported Lawphil index page.
             * This is not a legal document and must not appear
             * as Proclamation No. 13 in the application.
             *
             * The SQLite record is intentionally preserved.
             */
            if (selectedType === "Memorandum Order") {
    const hiddenMemorandumOrderIndexes = new Set([
        "memorandum-order-109",
        "memorandum-order-11",
        "memorandum-order-121",
        "memorandum-order-157",
        "memorandum-order-1963",
        "memorandum-order-208",
        "memorandum-order-265",
        "memorandum-order-330",
        "memorandum-order-402",
        "memorandum-order-47",
        "memorandum-order-477",
        "memorandum-order-51",
        "memorandum-order-553",
        "memorandum-order-579",
        "memorandum-order-605",
        "memorandum-order-634",
        "memorandum-order-681",
        "memorandum-order-709",
        "memorandum-order-743",
        "memorandum-order-768",
        "memorandum-order-802",
        "memorandum-order-817",
        "memorandum-order-831"
    ]);

    /*
     * Bulk OCR cleanup for obvious Lawphil library/header titles.
     *
     * Normalize OCR punctuation before testing so variants such as
     * "M/\\L/\\CANANG PMS LlBRAR'V" are recognized.
     *
     * This is display-only. Genuine Memorandum Orders with OCR-damaged
     * titles remain visible.
     */
    function isMemorandumOrderLibraryHeader(title) {

        const normalized =
            String(title || "")
                .toUpperCase()
                .replace(/[^A-Z]/g, "");

        return (
            normalized.includes("MALACANANGPMSLIBRARY") ||
            (
                normalized.includes("MALACANANGPALACEMANILA") &&
                normalized.length <= 45
            )
        );
    }

    categoryLaws = categoryLaws.filter(function (law) {

        const id =
            String(law.id || "");

        const title =
            String(law.title || "").trim();

        if (hiddenMemorandumOrderIndexes.has(id)) {
            return false;
        }

        if (isMemorandumOrderLibraryHeader(title)) {
            return false;
        }

        return true;
    });
}

if (selectedType === "Memorandum Circular") {
    categoryLaws = categoryLaws.filter(function (law) {
        return String(law.id || "") !== "memorandum-circular-120";
    });
}

if (selectedType === "Jurisprudence") {
    categoryLaws = categoryLaws.filter(function (law) {
        const title = String(law.title || "").trim();

        if (title === "Philippine Jurisprudence - The LawPhil Project") {
            return false;
        }

        if (title === "2015 Philippine Jurisprudence") {
            return false;
        }

        return !/^Year \d{4} Philippine Jurisprudence$/.test(title);
    });
}

if (selectedType === "Proclamation") {
                const hiddenProclamationIndexes = new Set([
                    "proclamation-13",
                    "proclamation-1382"
                ]);

                categoryLaws = categoryLaws.filter(function (law) {
                    return !hiddenProclamationIndexes.has(
                        String(law.id || "")
                    );
                });
            }

            categoryLaws.sort(function (a, b) {

                if (selectedType === "Memorandum Order") {
                    const moNumericOverrides = {
                        "memorandum-order-reconstxtunon": 3,
                        "memorandum-order-7ec5116b0ac052511fa9": 15,
                        "memorandum-order-j-lj-f": 246,
                        "memorandum-order-9q": 89,
                        "memorandum-order-i3t": 135,
                        "memorandum-order-ill": 177,
                        "memorandum-order-li": 153,
                        "memorandum-order-s9": 89,
                        "memorandum-order-1-82": 182,
                        "memorandum-order-malaca": 147,
                        "memorandum-order-0196857b4e97eb00ac28": 132,
                        "memorandum-order-1s": 106,
                        "memorandum-order-2-5-3": 253,
                        "memorandum-order-3-0-6": 306,
                        "memorandum-order-181-ocr": 181,
                        "memorandum-order-276": 276
                    };

                    function getMemorandumOrderSortNumber(law) {
                        const id = String(law.id || "");

                        if (Object.prototype.hasOwnProperty.call(
                            moNumericOverrides,
                            id
                        )) {
                            return moNumericOverrides[id];
                        }

                        const value = String(law.number || "").trim();
                        const match = value.match(/\d+/);

                        return match
                            ? parseInt(match[0], 10)
                            : Number.MAX_SAFE_INTEGER;
                    }

                    const numA = getMemorandumOrderSortNumber(a);
                    const numB = getMemorandumOrderSortNumber(b);

                    if (numA !== numB) {
                        return numA - numB;
                    }

                    return String(a.id || "").localeCompare(
                        String(b.id || ""),
                        undefined,
                        { sensitivity: "base" }
                    );
                }

                if (selectedType === "Other Issuance") {

                    function getOtherIssuanceSortKey(law) {
                        const value = String(
                            law.number || law.title || ""
                        ).trim();

                        const upper = value.toUpperCase();

                        let series = "OTHER";
                        let priority = 90;

                        if (/^RLA\s+BILL\s+NO\.?/i.test(value)) {
                            series = "RLA BILL";
                            priority = 10;
                        } else if (/^REGIONAL\s+(?:LEGISLATIVE\s+)?ASSEMBLY\s+BILL\s+NO\.?/i.test(value)) {
                            series = "REGIONAL ASSEMBLY BILL";
                            priority = 20;
                        } else if (/^RA\s+BILL\s+NO\.?/i.test(value)) {
                            series = "RA BILL";
                            priority = 30;
                        } else if (/^COMELEC\s+RESOLUTION\s+NO\.?/i.test(value)) {
                            series = "COMELEC RESOLUTION";
                            priority = 40;
                        } else if (/^COMELEC\s+MEMORANDUM/i.test(value)) {
                            series = "COMELEC MEMORANDUM";
                            priority = 50;
                        } else if (/^ACT\s+NO\.?/i.test(value)) {
                            series = "ACT";
                            priority = 60;
                        }

                        const match = value.match(/\d+/);
                        const num = match
                            ? parseInt(match[0], 10)
                            : Number.MAX_SAFE_INTEGER;

                        return {
                            priority,
                            series,
                            num,
                            text: upper
                        };
                    }

                    const keyA = getOtherIssuanceSortKey(a);
                    const keyB = getOtherIssuanceSortKey(b);

                    if (keyA.priority !== keyB.priority) {
                        return keyA.priority - keyB.priority;
                    }

                    if (keyA.num !== keyB.num) {
                        return keyA.num - keyB.num;
                    }

                    return keyA.text.localeCompare(keyB.text);
                }

                if (selectedType === "Jurisprudence") {
                    function getJurisprudenceSortKey(law) {
                        const value = String(
                            getLawNumber(law) ||
                            law.title ||
                            ""
                        )
                            .replace(/\s+/g, " ")
                            .trim();

                        const normalized = value
                            .toUpperCase()
                            .replace(/^A\.\s*C\./, "AC")
                            .replace(/^A\.\s*M\./, "AM")
                            .replace(/^G\.\s*R\./, "GR")
                            .replace(/^P\.\s*E\.\s*T\./, "PET")
                            .replace(/^ADM\.\s*CASE/, "ADM CASE");

                        const hasIdentifier =
                            /^(?:AC|AM|GR|PET|ADM CASE|P\.E\.T\.?|A\.M\.?|A\.C\.?|G\.R\.?)\b/i.test(normalized);

                        return {
                            unknown: hasIdentifier ? 0 : 1,
                            text: normalized,
                            original: value
                        };
                    }

                    const keyA = getJurisprudenceSortKey(a);
                    const keyB = getJurisprudenceSortKey(b);

                    if (keyA.unknown !== keyB.unknown) {
                        return keyA.unknown - keyB.unknown;
                    }

                    const result = keyA.text.localeCompare(
                        keyB.text,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                    if (result !== 0) {
                        return result;
                    }

                    return keyA.original.localeCompare(
                        keyB.original,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );
                }

                if (selectedType === "Court Issuance") {
                    function getCourtSortKey(law) {
                        const value = String(
                            getLawNumber(law) ||
                            law.title ||
                            ""
                        )
                            .replace(/\s+/g, " ")
                            .trim();

                        const normalized = value
                            .toUpperCase()
                            .replace(/A\.\s*M\./g, "AM")
                            .replace(/A\.M\./g, "AM")
                            .replace(/A\.\s*C\./g, "AC")
                            .replace(/A\.C\./g, "AC")
                            .replace(/B\.\s*M\./g, "BM")
                            .replace(/B\.M\./g, "BM")
                            .replace(/B\.\s*R\./g, "BR")
                            .replace(/B\.R\./g, "BR")
                            .trim();

                        const hasIdentifier =
                            /^(?:AM|AC|GR|BM|BR|J|OCA|CIRCULAR|REVISED CIRCULAR|SUPERVISORY CIRCULAR|ADMINISTRATIVE CIRCULAR)\b/i.test(normalized);

                        return {
                            unknown: hasIdentifier ? 0 : 1,
                            text: normalized,
                            original: value
                        };
                    }

                    const keyA = getCourtSortKey(a);
                    const keyB = getCourtSortKey(b);

                    if (keyA.unknown !== keyB.unknown) {
                        return keyA.unknown - keyB.unknown;
                    }

                    const result = keyA.text.localeCompare(
                        keyB.text,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );

                    if (result !== 0) {
                        return result;
                    }

                    return keyA.original.localeCompare(
                        keyB.original,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: "base"
                        }
                    );
                }

                return getNumericLawNumber(a) -
                       getNumericLawNumber(b);
            });

            console.log(
                "SQL CATEGORY:",
                category,
                "TYPE:",
                selectedType,
                "=>",
                categoryLaws.length,
                "laws"
            );

            /*
             * Court Issuances:
             * Hide four confirmed OCR/header fragments that have no
             * recognizable legal identifier. Keep their SQLite records
             * untouched.
             */
            if (selectedType === "Court Issuance") {
                const hiddenCourtOcrIds = new Set([
                ]);

                categoryLaws = categoryLaws.filter(function (law) {
                    return !hiddenCourtOcrIds.has(
                        String(law.id || "").trim()
                    );
                });
            }

            /*
             * Administrative Orders:
             * Hide two confirmed OCR-corrupted zero-provision records.
             * Keep all SQLite records untouched.
             */
            if (selectedType === "Administrative Order") {
                const hiddenAdministrativeOrderOcrIds = new Set([
                    "administrative-order-ard",
                    "administrative-order-tz"
                ]);

                categoryLaws = categoryLaws.filter(function (law) {
                    return !hiddenAdministrativeOrderOcrIds.has(
                        String(law.id || "").trim()
                    );
                });
            }

            /*
             * Jurisprudence:
             * Hide obvious OCR/header-only records from the display.
             * Keep all SQLite records untouched.
             */
            if (selectedType === "Jurisprudence") {
                categoryLaws = categoryLaws.filter(function (law) {
                    const number = String(
                        getLawNumber(law) || law.number || ""
                    ).trim();

                    const title = String(
                        law.title || ""
                    )
                        .replace(/\s+/g, " ")
                        .trim();

                    const combined = (number + " " + title).toUpperCase();

                    const hasCaseIdentifier =
                        /\b(?:A\.?\s*C\.?|A\.?\s*M\.?|G\.?\s*R\.?|P\.?\s*E\.?\s*T\.?|ADM\.?\s+CASE|ADMINISTRATIVE\s+CASE)\b/.test(combined);

                    const obviousHeader =
                        /REPUBLIC OF THE PHILIPPINES\s+SUPREME COURT/.test(combined) ||
                        /CERTIFIED\s+TRUE\s+COPY/.test(combined) ||
                        /SUPREME\s+COURT/.test(combined) && !hasCaseIdentifier ||
                        /PHILIPPINE\s+JURISPRUDENCE/.test(combined) && !hasCaseIdentifier ||
                        /TRUE\s+COPY/.test(combined) && !hasCaseIdentifier;

                    return !(obviousHeader && !hasCaseIdentifier);
                });
            }

            /*
             * Other Issuances contains mixed source documents:
             * actual issuances plus annexes, forms, page fragments,
             * catalog/index pages, and OCR-only labels.
             *
             * Keep all records in SQLite, but only display records that
             * have a recognizable substantive issuance identifier/title.
             */
            if (selectedType === "Other Issuance") {

                categoryLaws =
                    categoryLaws.filter(function (law) {

                        const title =
                            String(
                                law.title ||
                                ""
                            )
                            .trim();

                        const normalized =
                            title
                                .replace(/[“”]/g, '"')
                                .replace(/\s+/g, " ")
                                .trim();

                        if (!normalized) {
                            return false;
                        }

                        /*
                         * Supporting documents, forms, annexes and page labels.
                         */
                        if (
                            /^(?:annex|an\s*nex|amnex|arurex|a?nnx)\b/i.test(normalized) ||
                            /^(?:page|i['’]?age)\s*\d/i.test(normalized) ||
                            /^t[·.\'_\-\s]*page\s*\d/i.test(normalized) ||
                            /^ovf\s+no\.?/i.test(normalized) ||
                            /^revised\s+cef\b/i.test(normalized)
                        ) {
                            return false;
                        }

                        /*
                         * Generic / OCR-corrupted masthead-only titles.
                         */
                        if (
                            /^republic\s+of\s+the\s+ph(?:i|il)l?ipp?i+n(?:es)?(?:\s+pg.*)?$/i.test(normalized) ||
                            /^commission\s+on\s+elections$/i.test(normalized) ||
                            /^co\s*mis.*elections$/i.test(normalized) ||
                            /^comelec\s+resolutions?\s+\d{4}\b.*lawphil/i.test(normalized) ||
                            /^the\s+lawphil\s+project\b/i.test(normalized)
                        ) {
                            return false;
                        }

                        /*
                         * Clearly unusable OCR-only labels.
                         */
                        if (
                            normalized.length < 4 ||
                            /^[\W_]+$/u.test(normalized) ||
                            /^[0-9?./\\|~_'"\- ]+$/u.test(normalized) ||
                            /^\.o\b/i.test(normalized) ||
                            /^7\s*[?T/()]+$/i.test(normalized) ||
                            /^[=:;,\-]+$/.test(normalized)
                        ) {
                            return false;
                        }

                        /*
                         * Incomplete bill labels are source fragments.
                         * Fully numbered bills are retained.
                         */
                        if (
                            /^(?:rla|ra|regional\s+assembly|regional\s+legislative\s+assembly)\s+bill\s+no\.?$/i.test(normalized) ||
                            /^bill\s+no\.?$/i.test(normalized)
                        ) {
                            return false;
                        }

                        /*
                         * Generic assembly index pages.
                         */
                        if (
                            /^muslim\s+mindanao\s+autonomy\s+act\s*-\s*\d+(?:st|nd|rd|th)?\s+assembly$/i.test(normalized)
                        ) {
                            return false;
                        }

                        return true;
                    });
            }

            /*
             * Other Issuances: hide repeated bill copies in the UI only.
             * The SQLite records are NOT deleted or modified.
             *
             * Only deduplicate bill-like records when both the normalized
             * bill number and normalized display title are identical.
             * Different bills sharing the same number remain visible.
             */
            if (selectedType === "Other Issuance") {
                const seenBillDisplayKeys = new Set();

                categoryLaws = categoryLaws.filter(function (law) {
                    const numberText = String(law.number || "").trim();
                    const titleText = String(
                        cleanLawTitle(law) || law.title || ""
                    ).trim();

                    const isBill =
                        /\\b(?:RLA|RA)\\s+BILL\\s+(?:NO\\.?\\s*)?\\d+\\b/i.test(numberText) ||
                        /\\b(?:RLA|RA)\\s+BILL\\s+(?:NO\\.?\\s*)?\\d+\\b/i.test(titleText) ||
                        /\\bREGIONAL\\s+(?:LEGISLATIVE\\s+)?ASSEMBLY\\s+BILL\\s+(?:NO\\.?\\s*)?\\d+\\b/i.test(numberText) ||
                        /\\bREGIONAL\\s+(?:LEGISLATIVE\\s+)?ASSEMBLY\\s+BILL\\s+(?:NO\\.?\\s*)?\\d+\\b/i.test(titleText);

                    if (!isBill) {
                        return true;
                    }

                    const normalize = function (value) {
                        return String(value || "")
                            .toLowerCase()
                            .replace(/\\s+/g, " ")
                            .trim();
                    };

                    const key =
                        normalize(numberText) +
                        "||" +
                        normalize(titleText);

                    if (seenBillDisplayKeys.has(key)) {
                        return false;
                    }

                    seenBillDisplayKeys.add(key);
                    return true;
                });
            }

            /*
             * Administrative Orders:
             * Keep zero-provision records in SQLite, but do not show them
             * in the browse list. They are incomplete/index/source records.
             */
            if (selectedType === "Administrative Order") {
                categoryLaws = categoryLaws.filter(function (law) {
                    return Number(law.articleCount || 0) > 0;
                });
            }

            lawList.innerHTML = "";

            /*
             * Memorandum Orders:
             * Category records are lightweight and do not contain articles.
             * Bulk-load the existing full records so OCR-damaged or
             * number-only titles can display their actual legal description.
             *
             * Display-only. SQLite and the existing click behavior are
             * unchanged.
             */
            if (selectedType === "Memorandum Order") {

                Promise.all(
                    categoryLaws.map(function (law) {
                        return window.philippineLawsAPI
                            .getLawById(law.id)
                            .then(function (fullLaw) {
                                return {
                                    law: law,
                                    fullLaw: fullLaw
                                };
                            })
                            .catch(function () {
                                return {
                                    law: law,
                                    fullLaw: null
                                };
                            });
                    })
                ).then(function (items) {

                    if (selectedType === "Memorandum Order") {
                        const moDisplayNumbers = {
                            "memorandum-order-reconstxtunon": 3,
                            "memorandum-order-7ec5116b0ac052511fa9": 15,
                            "memorandum-order-j-lj-f": 246,
                            "memorandum-order-9q": 89,
                            "memorandum-order-i3t": 135,
                            "memorandum-order-ill": 177,
                            "memorandum-order-li": 153,
                            "memorandum-order-s9": 89,
                            "memorandum-order-1-82": 182,
                            "memorandum-order-malaca": 147,
                            "memorandum-order-0196857b4e97eb00ac28": 132,
                            "memorandum-order-1s": 106,
                            "memorandum-order-2-5-3": 253,
                            "memorandum-order-3-0-6": 306,
                            "memorandum-order-181-ocr": 181,
                            "memorandum-order-276": 276,
                            "memorandum-order-162": 162,
                            "memorandum-order-188": 188,
                            "memorandum-order-243": 243,
                            "memorandum-order-393": 393,
                            "memorandum-order-467": 467,
                            "memorandum-order-832": 832
                        };

                        items.sort(function (a, b) {
                            const idA = String((a.law || {}).id || "");
                            const idB = String((b.law || {}).id || "");

                            const valueA =
                                Object.prototype.hasOwnProperty.call(
                                    moDisplayNumbers,
                                    idA
                                )
                                    ? moDisplayNumbers[idA]
                                    : parseInt(
                                        String((a.law || {}).number || "")
                                            .match(/\d+/)?.[0] || "999999999",
                                        10
                                    );

                            const valueB =
                                Object.prototype.hasOwnProperty.call(
                                    moDisplayNumbers,
                                    idB
                                )
                                    ? moDisplayNumbers[idB]
                                    : parseInt(
                                        String((b.law || {}).number || "")
                                            .match(/\d+/)?.[0] || "999999999",
                                        10
                                    );

                            if (valueA !== valueB) {
                                return valueA - valueB;
                            }

                            return idA.localeCompare(
                                idB,
                                undefined,
                                { sensitivity: "base" }
                            );
                        });
                    }

                    items.forEach(function (item) {

                        const law = item.law;
                        const fullLaw = item.fullLaw;

                        const button =
                            document.createElement("button");

                        button.className =
                            "law-button";

                        const number =
                            getLawNumber(law);

                        let description =
                            cleanLawTitle(law);

                        /*
                         * Memorandum Order description.
                         *
                         * Use the database title when it contains a real
                         * description. Only recover a heading from article
                         * text when the database title is clearly unusable.
                         *
                         * Display-only. Database unchanged.
                         */

                        function moClean(value) {
                            return String(value || "")
                                .replace(/<[^>]*>/g, " ")
                                .replace(/&nbsp;/gi, " ")
                                .replace(/&amp;/gi, "&")
                                .replace(/&quot;/gi, '"')
                                .replace(/&#39;/gi, "'")
                                .replace(/&ntilde;/gi, "ñ")
                                .replace(/&#241;/gi, "ñ")
                                .replace(/&Ntilde;/gi, "Ñ")
                                .replace(/&#209;/gi, "Ñ")
                                .replace(/\s+/g, " ")
                                .trim();
                        }

                        function moBadTitle(value) {

                            const t = moClean(value);

                            if (!t) {
                                return true;
                            }

                            if (
                                /^MEMORANDUM\s*ORDER\s*(?:NO\.?)?\s*[-~!@#_.:;,\/\\]*\s*(?:\d+|[~!@#_.:;,\/\\]+)?\s*$/i.test(t)
                            ) {
                                return true;
                            }

                            if (
                                /^MEMORANDUM\s*ORDER\s*S\.?\s*\d{3,4}\s*$/i.test(t)
                            ) {
                                return true;
                            }

                            if (
                                /^THE\s+LAWP?HIL\s+PROJECT\b/i.test(t) ||
                                /^MALACA[NÑ]AN\b/i.test(t) ||
                                /^MALACANANG\b/i.test(t) ||
                                /^M\/?A?L\/?A?C\/?A?N\/?A?N/i.test(t)
                            ) {
                                return true;
                            }

                            /*
                             * Catch OCR-corrupted number-only Memorandum Order
                             * titles such as "I3T", "ill", "J.lJ.f.", "li;!"
                             * and similar short fragments after the prefix.
                             */
                            if (/^MEMORANDUM\s*ORDER\s*(?:NO\.?)?\s+/i.test(t)) {
                                const remainder = t
                                    .replace(/^MEMORANDUM\s*ORDER\s*(?:NO\.?)?\s+/i, "")
                                    .trim();

                                const remainderLetters =
                                    (remainder.match(/[A-Za-z]/g) || []).length;

                                if (
                                    remainder.length <= 15 &&
                                    remainderLetters <= 6
                                ) {
                                    return true;
                                }
                            }

                            const letters =
                                (t.match(/[A-Za-z]/g) || []).length;

                            const weird =
                                (t.match(/[~!@#$%^*_{}[\]|<>]/g) || []).length;

                            return letters < 12 ||
                                   weird > Math.max(8, letters * 0.25);
                        }

                        function moExtractHeading(value) {

                            let t = moClean(value);

                            const m =
                                t.match(
                                    /MEMORANDUM\s*ORDER\s*(?:NO\.?)?\s*(?:[0-9]+(?:-[A-Za-z])?|[~!@#_.:;,\/\\-]+)?\s*(.+)$/i
                                );

                            if (!m) {
                                return "";
                            }

                            t = m[1]
                                .replace(/^[~!@#_.:;,\/\\\-–—\s]+/, "")
                                .trim();

                            const stops = [
                                /\.\s+(?=WHEREAS\b)/i,
                                /\.\s+(?=This\s+Memorandum\b)/i,
                                /\.\s+(?=This\s+Order\b)/i,
                                /\.\s+(?=The\s+Memorandum\b)/i,
                                /\.\s+(?=Hereafter\b)/i,
                                /\.\s+(?=Effective\s+immediately\b)/i,
                                /\.\s+(?=Considering\s+that\b)/i,
                                /\.\s+(?=NOW,?\s+THEREFORE\b)/i
                            ];

                            let cut = -1;

                            for (const stop of stops) {
                                const hit = stop.exec(t);
                                if (
                                    hit &&
                                    hit.index >= 15 &&
                                    (cut === -1 || hit.index < cut)
                                ) {
                                    cut = hit.index;
                                }
                            }

                            if (cut >= 15) {
                                t = t.slice(0, cut).trim();
                            }

                            return moBadTitle(t) ? "" : t;
                        }

                        const moTitle = moClean(law.title);
                        const moUpper = moTitle.toUpperCase();

                        /*
                         * Exact OCR-recovery map for the remaining
                         * verified Memorandum Order records.
                         *
                         * Display-only. The SQLite database is unchanged.
                         */
                        
const mcFixedTitles = {
    "memorandum-circular-21-ocr": "MALACAÑANG",
    "memorandum-circular-4-ocr": "MEMORANDUM CIRCULAR NO. 4",
    "memorandum-circular-00": "MEMORANDUM CIRCULAR NO. 112 — HOUSING FAIR FOR EMPLOYEES IN THE PUBLIC SECTOR",
    "memorandum-circular-1027": "MEMORANDUM CIRCULAR NO. 1027",
    "memorandum-circular-11": "MEMORANDUM CIRCULAR NO. 11",
    "memorandum-circular-1108": "MEMORANDUM CIRCULAR NO. 1108",
    "memorandum-circular-1178": "MEMORANDUM CIRCULAR NO. 1178",
    "memorandum-circular-368": "MEMORANDUM CIRCULAR NO. 368",
    "memorandum-circular-384": "MEMORANDUM CIRCULAR NO. 384",
    "memorandum-circular-443": "MEMORANDUM CIRCULAR NO. 443",
    "memorandum-circular-488": "MEMORANDUM CIRCULAR NO. 488",
    "memorandum-circular-77": "MEMORANDUM CIRCULAR NO. 77"
};

const moFixedNumbers = {
    "memorandum-order-reconstxtunon": "3",
    "memorandum-order-malaca": "147",
                            "memorandum-order-0196857b4e97eb00ac28": "132",
                            "memorandum-order-1s": "106",
                            "memorandum-order-2-5-3": "253",
                            "memorandum-order-3-0-6": "306",
                            "memorandum-order-181-ocr": "181",
                            "memorandum-order-7ec5116b0ac052511fa9": "15",
                            "memorandum-order-9q": "89",
                            "memorandum-order-i3t": "135",
                            "memorandum-order-ill": "177",
                            "memorandum-order-j-lj-f": "246",
    "memorandum-order-276": "276",
                            "memorandum-order-li": "153",
                            "memorandum-order-s9": "89",
                            "memorandum-order-1-82": "182"
                        };

                        /*
                         * Targeted descriptions for ONLY the verified
                         * OCR-corrupted Memorandum Orders.
                         *
                         * Display-only. Database unchanged.
                         */
                        const moFixedDescriptions = {
    "memorandum-order-reconstxtunon":
        "RECONSTITUTION OF THE DISPOSAL COMMITTEE IN THE OFFICE OF THE PRESIDENT",
    "memorandum-order-malaca":
        "DIRECTING THE HOUSING AND URBAN DEVELOPMENT COORDINATING COUNCIL (HUDCC) TO FORMULATE A MASTER DEVELOPMENT PLAN FOR THE ACQUISITION, DEVELOPMENT AND DISPOSITION OF PHILIPPINE NATIONAL RAILWAYS (PNR) PROPERTY IN LIPA CITY, IDENTIFIED AS OUTSIDE OF PNR RIGHT-OF-WAY RETENTION AREA AND RESERVED AS HOUSING SITE FOR INFORMAL SETTLERS PRESENTLY RESIDING THEREIN.",
    "memorandum-order-135":
        "Amending the Memorandum Dated January 28, 1987 Creating the Cabinet Crisis Committee",
    "memorandum-order-131":
        "Prescribing the Procedure and Guidelines on Applications for Permits to Locate, Dig and Excavate Hidden Treasure in Accordance with the Provisions of Presidential Decree No. 1726-A",
    "memorandum-order-47":
        "Authorizing All Officials Who Hold Regular Plantilla Positions of Director IV in the Office of the President Proper to Incur Extra-Ordinary and Miscellaneous Expenses in Connection with the Performance of Their Official Duties",
    "memorandum-order-419":
        "Authorizing All Government Agencies and Instrumentalities to Extend Support and Participation in the Conduct of the First Kabisig Mindanao Congress to Be Held on March 14-15, 1997 in Davao City",
    "memorandum-order-34":
        "Creating the Ad Hoc Special Cabinet Committee for the Development of Subic Naval Base",
    "memorandum-order-376":
        "Rules and Regulations on Sexual Harassment Cases in the Office of the President Proper",
    "memorandum-order-386":
        "Expansion of Marine Science Research and Development (R&D) Programs",
    "memorandum-order-276":
        "Amending Memorandum Order No. 243 Dated 09 December 1994 Entitled Amending Memorandum Order No. 142 Dated 07 July 1993",

                            "memorandum-order-832":
                                "AUTHORIZING CERTAIN OFFICIALS OF THIS OFFICE TO DRAW TRANSPORTATION AND REPRESENTATION ALLOWANCES AT THE REVISED RATES.",
                            "memorandum-order-0196857b4e97eb00ac28":
                                "Dissolving the Screening Committee Created Pursuant to Memorandum Order No. 93, S. 1993 and Directing the New Philippine National Police (PNP) Leadership to Continue with the PNP Reforms",
                            "memorandum-order-1s":
                                "Enjoining All the Departments, Bureaus, Offices, and Agencies Including Local Government Units and Government-Owned and Controlled Corporations to Support the President's 1993 Summer Youth Work Program (PSYWP)",
                            "memorandum-order-2-5-3":
                                "Further Amending Memorandum Order No. 179 Dated November 6, 1993 as Amended Extending the Deadline for the Filing of Application Until February 25, 1995 with the Special Committee Pursuant to Said Memorandum Order",
                            "memorandum-order-3-0-6":
                                "Creating a Technical Review Committee to Conduct a Thorough Re-Evaluation and Review of the National Program for Unification and Development",
                            "memorandum-order-181-ocr":
                                "Creating an Inter-Agency Committee to Conduct a Review of the Metro Rail Transit 3 Project",
                            "memorandum-order-7ec5116b0ac052511fa9":
                                "Modifying Executive Order No. 8 Dated March 18, 1986 Creating the Presidential Committee on Human Rights",
                        
                            "memorandum-order-j-lj-f":
                                "Amending Memorandum Order No. 266, s. 2007 Creating a Committee on Decorum and Investigation (CODI) of Sexual Harassment Cases in the Office of the President (OP)",
                            "memorandum-order-i3t":
                                "RECONSTITUTING THE PRESIDENT'S PERSONNEL GROUP",
                            "memorandum-order-ill":
                                "AMENDING MEMORANDUM ORDER NO. 131",
                            "memorandum-order-li":
                                "ESTABLISHING A TRANSITION MECHANISM",
                            "memorandum-order-s9":
                                "AUTHORITY TO CONDUCT A NATIONAL SUMMIT ON PEACE AND ORDER",
                            "memorandum-order-1-82":
                                "Amending Memorandum Order No. 157 Dated 16 August 1993"
                        };

                        const moFixedNumber =
                            moFixedNumbers[String(law.id || "")] || "";

                        let moDisplayNumber =
                            moFixedNumber
                                ? "MEMORANDUM ORDER NO. " + moFixedNumber
                                : number;

                        const moFixedDisplayTitle =
                            moFixedNumber
                                ? "MEMORANDUM ORDER NO. " + moFixedNumber
                                : moTitle;

                        const mcFixedTitle =
                            mcFixedTitles[String(law.id || "")] || "";

                        if (
                            String(law.type || "") === "Memorandum Circular" &&
                            mcFixedTitle
                        ) {
                            moDisplayNumber = mcFixedTitle;
                            moFixedDisplayTitle = mcFixedTitle;
                        }

                        const moLetters =
                            (moTitle.match(/[A-Za-z]/g) || []).length;

                        const moDigits =
                            (moTitle.match(/[0-9]/g) || []).length;

                        const moStartsWithNumber =
                            /^[0-9]{1,4}(?:\\s|$)/.test(moTitle);

                        const moNumberOnly =
                            moUpper.indexOf("MEMORANDUM ORDER") === 0 &&
                            moTitle.length <= 35 &&
                            moLetters <= 10 &&
                            moDigits >= 1;

                        
const moOcrVisualFixes = [
    [/AMENDINGTHE MEMORANDUM DATEDJANUARY28/i,
     "135",
     "Amending the Memorandum Dated January 28, 1987 Creating the Cabinet Crisis Committee"],

    [/PRESCRIBING THE.*HIDDEN TREA/i,
     "131",
     "Prescribing the Procedure and Guidelines on Applications for Permits to Locate, Dig and Excavate Hidden Treasure in Accordance with the Provisions of Presidential Decree No. 1726-A"],

    [/ALL OFFICIALS WHO HOLD REGULAR PLANTILLA POSITIONS OF DIRECTOR IV/i,
     "47",
     "Authorizing All Officials Who Hold Regular Plantilla Positions of Director IV in the Office of the President Proper to Incur Extra-Ordinary and Miscellaneous Expenses in Connection with the Performance of Their Official Duties"],

    [/AUTHORIZING ALL GOVERNMENT AGENCIES AND INSTRUMENTALITIES.*FIRST KABISIG MINDANAO CONGRESS/i,
     "419",
     "Authorizing All Government Agencies and Instrumentalities to Extend Support and Participation in the Conduct of the First Kabisig Mindanao Congress to Be Held on March 14-15, 1997 in Davao City"],

    [/CREATING THE AD HOC SPECIAL CABINET COMMITTEE.*SUBIC NAVAL/i,
     "34",
     "Creating the Ad Hoc Special Cabinet Committee for the Development of Subic Naval Base"],

    [/EXPANSION OF MARINE SCIENCE RESEARCH AND DEVELOPMENT/i,
     "386",
     "Expansion of Marine Science Research and Development (R&D) Programs"],

    [/AMENDINGMEMORANDUM ORDERNO\. 243/i,
     "276",
     "Amending Memorandum Order No. 243 Dated 09 December 1994 Entitled Amending Memorandum Order No. 142 Dated 07 July 1993"],

    [/PRESCRIBING THE OFFICIAL DOCUMENTS THAT MAY/i,
     "28",
     "Prescribing the Official Documents That May Be Signed by the Senior Deputy Executive Secretary and the Deputy Executive Secretary \"By Authority of the President\""],

    [/These rules shall cover all officials/i,
     "376",
     "Providing Rules and Regulations Prescribing the Procedure for the Investigation of Sexual Harassment Cases and the Administrative Sanctions Therefor in the Office of the President Proper"],

    [/\(COP\) AS APPROVED UNDER MEMORANDUM ORDER NOS\. 68/i,
     "134",
     "Further Modifying the Guidelines to the Car Development Program (CDP) as Approved Under Memorandum Order Nos. 68 (S. of 1992) and 136 (S. of 1987)"]
];

let moOcrVisualFix = "";

if (fullLaw && Array.isArray(fullLaw.articles)) {
    const moBody = fullLaw.articles
        .map(a => moClean((a || {}).text || ""))
        .join(" ");

    for (const [pattern, moNumber, title] of moOcrVisualFixes) {
        if (pattern.test(moBody)) {
            moOcrVisualFix = title;
            if (moNumber) {
                moDisplayNumber = "MEMORANDUM ORDER NO. " + moNumber;
            }
            break;
        }
    }
}

if (moOcrVisualFix) {
    description = moOcrVisualFix;
}

const moNeedsDescription =
                            !!moFixedNumber ||
                            moBadTitle(law.title) ||
                            moNumberOnly ||
                            (
                                moStartsWithNumber &&
                                moTitle.length > 30
                            );

                        if (moNeedsDescription) {

                            description =
                                moFixedDescriptions[String(law.id || "")] || "";

                            if (
                                !description &&
                                fullLaw &&
                                Array.isArray(fullLaw.articles)
                            ) {
                                for (
                                    let i = 0;
                                    i < fullLaw.articles.length;
                                    i++
                                ) {
                                    const article =
                                        fullLaw.articles[i] || {};

                                    const recovered =
                                        moExtractHeading(
                                            article.text
                                        );

                                    if (recovered) {
                                        description = recovered;
                                        break;
                                    }
                                }
                            }

                            if (
                                !description &&
                                fullLaw &&
                                Array.isArray(fullLaw.articles) &&
                                fullLaw.articles.length
                            ) {
                                const firstText =
                                    moClean(
                                        String(
                                            (fullLaw.articles[0] || {}).text || ""
                                        )
                                    );

                                if (firstText.length > 0) {
                                    description = firstText;
                                }
                            }

                            /*
                             * The exact OCR-recovered Memorandum Orders
                             * have the corrupted order number at the start
                             * of the recovered heading. Remove that heading
                             * only from these mapped records.
                             *
                             * Display-only. Database and article text
                             * remain unchanged.
                             */
                            if (moFixedNumber && description) {
                                description =
                                    description
                                        .replace(
                                            /^MEMORANDUM\s*ORDER\s*NO\.?\s*/i,
                                            ""
                                        )
                                        .replace(
                                            /^[^A-Za-z]{0,12}\s*/,
                                            ""
                                        )
                                        .trim();
                            }

                        } else {

                            description =
                                moFixedDisplayTitle;
                        }

                        /*
                         * Final visual correction for the exact OCR-corrupted
                         * Memorandum Order records identified above.
                         *
                         * This is deliberately AFTER all fallback recovery
                         * logic so the corrupted article text cannot overwrite
                         * the clean display title.
                         *
                         * Display-only. Database unchanged.
                         */
                        if (moOcrVisualFix) {
                            description = moOcrVisualFix;
                        }

                        /*
                         * Final cleanup for the exact OCR-recovered
                         * Memorandum Orders. The corrected number is
                         * already displayed separately above, so remove
                         * the OCR number/header from the description.
                         */
const moExactGarbageVisualFixes = [
    [
        /shall take effect DONE in the City of Manilaj/i,
        "64",
        "Directing the Immediate Implementation of Energy Conservation Measures in the Government"
    ],
    [
        /shall take effect immediately\. By the President:.*ISIO C\. DE LA SERNA/i,
        "38",
        "Directing Cabinet Members to Provide Support Which May Be Required From Their Respective Departments for the Efficient Implementation of the CALABARZON Project"
    ],
    [
        /AMENDINGMEMORANDUM ORDERNO\. 243/i,
        "276",
        "Amending Memorandum Order No. 243 Dated 09 December 1994 Entitled Amending Memorandum Order No. 142 Dated 07 July 1993"
    ],
    [
        /\(COP\) AS APPROVED UNDER MEMORANDUM ORDER NOS\. 68/i,
        "134",
        "Further Modifying the Guidelines to the Car Development Program (CDP) as Approved Under Memorandum Order Nos. 68 (s. of 1992) and 136 (s. of 1987)"
    ],
    [
        /^Investment Priorities Plan 2$/i,
        "427",
        "Approving the 1992 Investment Priorities Plan"
    ],
];

const moExactGarbageVisualFix = moExactGarbageVisualFixes.find(
    ([pattern]) => pattern.test(String(description || ""))
);

if (moExactGarbageVisualFix) {
    moDisplayNumber =
        "MEMORANDUM ORDER NO. " +
        moExactGarbageVisualFix[1];

    description =
        moExactGarbageVisualFix[2];
}

                        if (moFixedNumber && description) {
                            const fixedPrefix =
                                "MEMORANDUM ORDER NO. " +
                                moFixedNumber;

                            description =
                                description
                                    .replace(
                                        /^MEMORANDUM\s*ORDER\s*NO\.?\s*/i,
                                        ""
                                    )
                                    .replace(
                                        new RegExp(
                                            "^" +
                                            moFixedNumber.replace(
                                                /[.*+?^${}()|[\]\\]/g,
                                                "\\$&"
                                            ) +
                                            "\\s*",
                                            "i"
                                        ),
                                        ""
                                    )
                                    .trim();
                        }

                        /*
                         * FINAL DISPLAY-ONLY FIX: Memorandum Order No. 10.
                         * This runs immediately before card rendering.
                         * Database/category unchanged.
                         */
                        if (
                            String(law.type || "").toLowerCase() === "memorandum orders" &&
                            Number(law.articleCount || 0) === 6 &&
                            String(description || "").trim().toLowerCase() ===
                                "are hereby revoked or amended accordingly."
                        ) {
                            moDisplayNumber = "MEMORANDUM ORDER NO. 10";
                            description =
                                "RECONSTITUTING THE INTERNAL AFFAIRS AND COMPLAINTS COMMITTEE IN THE OFFICE AND AMENDING MEMORANDUM ORDER NO. 182, SERIES 2005 AS AMENDED BY MEMORANDUM ORDER NO.295, SERIES 2009";
                        }

                        /*
                         * Exact display-only fix for the verified malformed
                         * Memorandum Order record. ID-specific: no other
                         * Memorandum Order or category is affected.
                         */
                        if (String(law.id || "") === "memorandum-order-t") {
                            moDisplayNumber =
                                "MEMORANDUM ORDER NO. 386";
                            description =
                                "Expansion of Marine Science Research and Development (R&D) Programs";
                        }

                        const count =
                            selectedType === "Jurisprudence" &&
                            Number(law.articleCount || 0) === 0 &&
                            String(law.text || "").trim()
                                ? 1
                                : Number(law.articleCount || 0);

                        button.innerHTML =
                            '<div class="law-number">' +
                            escapeHtml(moDisplayNumber) +
                            "</div>" +
                            '<div class="law-title">' +
                            escapeHtml(description) +
                            "</div>" +
                            '<div class="law-count">' +
                            count +
                            (count === 1
                                ? " provision"
                                : " provisions") +
                            "</div>";

                        button.addEventListener(
                            "click",
                            function () {

                                lawList.innerHTML =
                                    '<div style="padding:20px;">' +
                                    "Loading law...</div>";

                                window.philippineLawsAPI
                                    .getLawById(law.id)
                                    .then(function (fullLaw) {

                                        if (!fullLaw) {
                                            throw new Error(
                                                "Law record not found."
                                            );
                                        }

                                        selectLaw(fullLaw);
                                    })
                                    .catch(function (error) {

                                        console.error(
                                            "FAILED TO LOAD LAW:",
                                            error
                                        );

                                        lawList.innerHTML =
                                            '<div style="padding:20px;color:#b00020;">' +
                                            "<strong>Unable to load law.</strong><br><br>" +
                                            escapeHtml(
                                                error.message ||
                                                String(error)
                                            ) +
                                            "</div>";
                                    });
                            }
                        );

                        lawList.appendChild(button);
                    });

                    /*
                     * Final visible-order enforcement for Memorandum Orders.
                     * Sort the actual rendered buttons numerically by the
                     * displayed Memorandum Order number.
                     *
                     * Display-only. Database unchanged.
                     */
                    if (selectedType === "Memorandum Order") {
                        const moButtons = Array.from(lawList.children); console.log("MO SORT CHECK:", moButtons.length, moButtons.map(function(b){ return String(b.textContent||"").match(/MEMORANDUM ORDER NO\.?\s*(\d+)/i)?.[1] || "NO_NUMBER"; }));

                        moButtons.sort(function (a, b) {
                            const textA = String(a.textContent || "");
                            const textB = String(b.textContent || "");

                            const matchA = textA.match(
                                /MEMORANDUM ORDER NO\.?\s*(\d+)/i
                            );
                            const matchB = textB.match(
                                /MEMORANDUM ORDER NO\.?\s*(\d+)/i
                            );

                            const numberA = matchA
                                ? parseInt(matchA[1], 10)
                                : 999999999;

                            const numberB = matchB
                                ? parseInt(matchB[1], 10)
                                : 999999999;

                            return numberA - numberB;
                        });

                        moButtons.forEach(function (button) {
                            lawList.appendChild(button);
                        });
                    }

                }).catch(function (error) {

                    console.error(
                        "FAILED TO LOAD MEMORANDUM ORDERS:",
                        error
                    );

                    lawList.innerHTML =
                        '<div style="padding:20px;color:#b00020;">' +
                        "<strong>Unable to load Memorandum Orders.</strong><br><br>" +
                        escapeHtml(
                            error.message ||
                            String(error)
                        ) +
                        "</div>";
                });

                return;
            }

            if (selectedType === "Court Issuance") {
                const targetCourtId =
                    "court-issuance-doc-93084ede1a5b5c6f1d56d085";

                const targetCourtLaw = {
                    id: targetCourtId,
                    number: "ADMINISTRATIVE CIRCULAR NO. 1",
                    type: "Court Issuance",
                    title:
                        "IMPLEMENTATION OF SEC. 12, ART. XVIII OF THE 1987 CONSTITUTION",
                    subjects: [],
                    articleCount: 2
                };

                const targetAlreadyPresent = categoryLaws.some(
                    function (law) {
                        return String(law.id || "") === targetCourtId;
                    }
                );

                if (!targetAlreadyPresent) {
                    categoryLaws.push(targetCourtLaw);
                }
            }

            categoryLaws.forEach(function (law) {

                const button =
                    document.createElement("button");

                button.className =
                    "law-button";

                const number =
                    selectedType === "Other Issuance" &&
                    law.number &&
                    !/^DOC-/i.test(String(law.number).trim())
                        ? String(law.number).trim()
                        : getLawNumber(law);

                let displayNumber = number;
                let description = cleanLawTitle(law);

                /*
                 * Jurisprudence bulk card cleanup.
                 *
                 * Display-only.
                 * Uses the already-loaded titleSource.
                 * No getLawById() calls.
                 * Database unchanged.
                 *
                 * law.number is an internal sequence and is never
                 * used as the public case identifier.
                 */
                if (selectedType === "Jurisprudence") {

                    /*
                     * DISPLAY-ONLY BULK JURISPRUDENCE FORMATTER
                     *
                     * Uses titleSource already returned by getLawsByType().
                     * No database writes.
                     * No getLawById() calls.
                     * law.number is INTERNAL and is never used as the
                     * public jurisprudence case identifier.
                     */

                    const jpSource =
                        String(law.titleSource || law.text || "")
                            .replace(/\r/g, "")
                            .trim();

                    const jpLines =
                        jpSource
                            .split(/\n/)
                            .map(function (line) {
                                const element =
                                    document.createElement("textarea");

                                element.innerHTML =
                                    String(line || "");

                                return element.value
                                    .replace(/&nbsp;/gi, " ")
                                    .replace(
                                        /\b(G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.?)\s*[~]?\s*[PpOo]\.?(?=\s*[A-Z0-9])/gi,
                                        function (_, prefix) {
                                            return prefix + " No.";
                                        }
                                    )
                                    .replace(/~[PpOo]\.?/g, "No.")
                                    .replace(/\s+/g, " ")
                                    .trim();
                            })
                            .filter(Boolean);

                    const jpMonths =
                        "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

                    function jpClean(value) {
                        return String(value || "")
                            .replace(/\s+/g, " ")
                            .trim();
                    }

                    function jpIsNoise(value) {
                        const x = jpClean(value);
                        const u = x.toUpperCase();

                        if (!x || x.length < 3) return true;

                        if (
                            /REPUBLIC OF THE PHILIPPINES|SUPREME COURT/.test(u)
                        ) return true;

                        if (
                            /^(?:MANILA|BAGUIO CITY|PHILIPPINES|EN BANC)$/.test(u)
                        ) return true;

                        if (
                            /^(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s+DIVISION$/.test(u)
                        ) return true;

                        if (
                            /^(?:DECISION|R E S O L U T I O N|D E C I S I O N|RESOLUTION|DISSENTING OPINION|CONCURRING OPINION)$/.test(u)
                        ) return true;

                        if (
                            /^(?:WHEREFORE|NOW,\s*THEREFORE)\b/.test(u)
                        ) return true;

                        return false;
                    }

                    function jpExtractNumber(value) {
                        const x = jpClean(value);

                        const patterns = [
                            /^((?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+(?:No\.?|Nos\.?|Case\s+No\.?|CBD\s+No\.?)\s*[A-Z0-9][A-Z0-9./~&()\-]*(?:\s+(?:[A-Z][A-Z0-9./~&()\-]*|and|&))*?)(?=\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}|$)/i,
                            /^(CA-G\.?\s*R\.?\s*(?:SP|CV|CR)\s+(?:No\.?|Nos\.?)\s*[A-Z0-9][A-Z0-9./~&()\-]*(?:\s+(?:[A-Z][A-Z0-9./~&()\-]*|and|&))*?)(?=\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}|$)/i,
                            /^((?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.?|J\.?|OCA)\s+(?:No\.?|Nos\.?|Case\s+No\.?|CBD\s+No\.?)\s*[A-Z0-9][A-Z0-9./~&()\-]*)/i,
                            /^(CA-G\.?\s*R\.?\s*(?:SP|CV|CR)\s+(?:No\.?|Nos\.?)\s*[A-Z0-9][A-Z0-9./~&()\-]*)/i
                        ];

                        for (const pattern of patterns) {
                            const match = x.match(pattern);

                            if (match) {
                                return jpClean(match[1])
                                    .replace(
                                        new RegExp(
                                            "\\s+" +
                                            jpMonths +
                                            "\\s+\\d{1,2},\\s+\\d{4}.*$",
                                            "i"
                                        ),
                                        ""
                                    )
                                    .trim();
                            }
                        }

                        return "";
                    }

                    function jpStripDocketDate(value) {
                        return jpClean(value)
                            .replace(
                                new RegExp(
                                    "^.*?" +
                                    jpMonths +
                                    "\\s+\\d{1,2},\\s+\\d{4}\\s*",
                                    "i"
                                ),
                                ""
                            )
                            .trim();
                    }

                    function jpCaption(value) {
                        const x = jpClean(value);

                        if (
                            x.length < 4 ||
                            x.length > 1800 ||
                            jpIsNoise(x)
                        ) {
                            return "";
                        }

                        if (jpExtractNumber(x)) {
                            return "";
                        }

                        return x;
                    }

                    function jpLooksLikeCaption(value) {
                        const x = jpClean(value);

                        if (!x || jpIsNoise(x)) return false;

                        if (
                            /,\s*(?:complainant|complainants|petitioner|petitioners|plaintiff|plaintiffs|appellant|appellants|respondent|respondents|defendant|defendants|accused|accused-appellant|accused-appellee)\b/i.test(x)
                        ) {
                            return true;
                        }

                        if (
                            /^(?:IN\s+RE\b|IN\s+THE\s+MATTER\b|EN\s+EL\s+ASUNTO\s+DE\b)/i.test(x)
                        ) {
                            return true;
                        }

                        if (
                            /\b(?:complainant|petitioner|plaintiff|appellant|respondent|defendant|accused)\b/i.test(x) &&
                            x.length >= 8
                        ) {
                            return true;
                        }

                        return false;
                    }

                    function jpJoin(parts) {
                        return jpClean(
                            parts
                                .map(jpClean)
                                .filter(Boolean)
                                .join(" ")
                        );
                    }

                    let jpRecoveredNumber = "";
                    let jpRecoveredTitle = "";
                    let jpDocketIndex = -1;

                    /*
                     * The first usable docket near the top is the primary
                     * public case number for this card.
                     *
                     * This intentionally prevents later cases embedded in
                     * the same source document from replacing the card's
                     * own docket.
                     */
                    for (
                        let i = 0;
                        i < Math.min(jpLines.length, 30);
                        i++
                    ) {
                        const n = jpExtractNumber(jpLines[i]);

                        if (n) {
                            jpRecoveredNumber = n;
                            jpDocketIndex = i;
                            break;
                        }
                    }

                    if (jpDocketIndex >= 0) {

                        /*
                         * Start after the primary docket. The next docket
                         * line is commonly the formal case header containing
                         * the date. Caption extraction begins after that.
                         */
                        let captionStart = jpDocketIndex + 1;

                        for (
                            let i = jpDocketIndex + 1;
                            i < Math.min(jpLines.length, jpDocketIndex + 15);
                            i++
                        ) {
                            const x = jpClean(jpLines[i]);

                            if (!x) continue;

                            const hasDate =
                                new RegExp(
                                    jpMonths +
                                    "\\s+\\d{1,2},\\s+\\d{4}",
                                    "i"
                                ).test(x);

                            const hasDocket =
                                !!jpExtractNumber(x);

                            if (hasDate && hasDocket) {
                                captionStart = i + 1;
                                break;
                            }

                            /*
                             * Some older records put the date/header on
                             * the primary docket itself. In that case,
                             * continue directly into the caption.
                             */
                            if (
                                hasDate &&
                                i === jpDocketIndex + 1
                            ) {
                                captionStart = i + 1;
                                break;
                            }
                        }

                        const windowLines = [];

                        for (
                            let i = captionStart;
                            i < Math.min(jpLines.length, captionStart + 25);
                            i++
                        ) {
                            let x = jpClean(jpLines[i]);

                            if (!x) continue;

                            if (jpIsNoise(x)) continue;

                            if (jpExtractNumber(x)) {

                                /*
                                 * MODERN OCR EXCEPTION:
                                 *
                                 * Some recent decisions put the docket and
                                 * party caption on the SAME line, e.g.
                                 *
                                 * G.R. No. 253480 (Teodoro B. Bunayog,
                                 * petitioner vs. Foscon Shipmanagement...)
                                 *
                                 * Do not discard that caption as a new
                                 * docket. Recover it here.
                                 */
                                const docketCaptionMatch =
                                    x.match(
                                        /^(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.?)\s+No\.?\s*[A-Z0-9./~&()\-]+\s*[(:-]\s*(.+)$/i
                                    );

                                if (docketCaptionMatch) {
                                    let inlineCaption =
                                        jpClean(docketCaptionMatch[1]);

                                    if (inlineCaption) {
                                        windowLines.push(
                                            inlineCaption
                                        );

                                        /*
                                         * Continue collecting the OCR
                                         * caption until the respondent
                                         * portion is reached.
                                         */
                                        for (
                                            let k = i + 1;
                                            k < Math.min(
                                                jpLines.length,
                                                i + 10
                                            );
                                            k++
                                        ) {
                                            let continuation =
                                                jpClean(jpLines[k]);

                                            if (!continuation) continue;

                                            if (
                                                jpExtractNumber(continuation)
                                            ) {
                                                break;
                                            }

                                            if (jpIsNoise(continuation)) {
                                                continue;
                                            }

                                            continuation =
                                                jpStripDocketDate(
                                                    continuation
                                                );

                                            if (!continuation) continue;

                                            windowLines.push(
                                                continuation
                                            );

                                            if (
                                                /\brespond(?:ent|ents)\b/i.test(
                                                    continuation
                                                )
                                            ) {
                                                break;
                                            }
                                        }
                                    }

                                    continue;
                                }

                                /*
                                 * A later docket means the next case has
                                 * started. Never cross into it.
                                 */
                                break;
                            }

                            x = jpStripDocketDate(x);

                            if (!x) continue;
                            if (jpIsNoise(x)) continue;

                            windowLines.push(x);
                        }

                        /*
                         * Find the first VS/VERSUS separator and combine
                         * the complete meaningful caption on both sides.
                         *
                         * This fixes multi-line captions instead of taking
                         * only the nearest single line.
                         */
                        for (let i = 0; i < windowLines.length; i++) {

                            if (
                                !/^(?:vs?\.?|versus)$/i.test(
                                    windowLines[i]
                                )
                            ) {
                                continue;
                            }

                            const leftParts = [];
                            const rightParts = [];

                            for (let j = i - 1; j >= 0; j--) {
                                const candidate =
                                    jpCaption(windowLines[j]);

                                if (!candidate) continue;

                                if (
                                    /^(?:MAKALINTAL|PABLO|REYES|FERNANDEZ|CONCEPCION|DIAZ|J\.|C\.J\.)[\s,:]/i.test(candidate)
                                ) {
                                    continue;
                                }

                                leftParts.unshift(candidate);

                                /*
                                 * Stop once we have reached a likely caption
                                 * beginning. This avoids pulling institutional
                                 * or unrelated text into the title.
                                 */
                                if (
                                    jpLooksLikeCaption(candidate) ||
                                    /^(?:PETITION|IN\s+RE|IN\s+THE\s+MATTER|EN\s+EL\s+ASUNTO)\b/i.test(candidate)
                                ) {
                                    break;
                                }

                                if (leftParts.length >= 5) break;
                            }

                            for (
                                let j = i + 1;
                                j < windowLines.length;
                                j++
                            ) {
                                const candidate =
                                    jpCaption(windowLines[j]);

                                if (!candidate) continue;

                                if (
                                    /^(?:MAKALINTAL|PABLO|REYES|FERNANDEZ|CONCEPCION|DIAZ|J\.|C\.J\.)[\s,:]/i.test(candidate)
                                ) {
                                    break;
                                }

                                rightParts.push(candidate);

                                if (
                                    jpLooksLikeCaption(candidate)
                                ) {
                                    break;
                                }

                                if (rightParts.length >= 5) break;
                            }

                            const left = jpJoin(leftParts);
                            const right = jpJoin(rightParts);

                            if (left && right) {
                                jpRecoveredTitle =
                                    left +
                                    " vs. " +
                                    right;
                                break;
                            }
                        }

                        /*
                         * Single-line VS/V/VERSUS caption.
                         */
                        if (!jpRecoveredTitle) {
                            for (const x of windowLines) {

                                const match =
                                    x.match(
                                        /^(.{3,1200}?)\s+(?:vs?\.?|versus)\s+(.{3,1400})$/i
                                    );

                                if (!match) continue;

                                const left =
                                    jpClean(match[1]);

                                const right =
                                    jpClean(match[2]);

                                if (
                                    !jpIsNoise(left) &&
                                    !jpIsNoise(right)
                                ) {
                                    jpRecoveredTitle =
                                        left +
                                        " vs. " +
                                        right;
                                    break;
                                }
                            }
                        }

                        /*
                         * IN RE / IN THE MATTER / EN EL ASUNTO.
                         */
                        if (!jpRecoveredTitle) {
                            for (const x of windowLines) {

                                if (
                                    /^(?:IN\s+RE\b|IN\s+THE\s+MATTER\b|EN\s+EL\s+ASUNTO\s+DE\b)/i.test(x)
                                ) {
                                    jpRecoveredTitle =
                                        jpCaption(x);
                                    break;
                                }
                            }
                        }

                        /*
                         * Caption without VS. This includes historical
                         * records such as:
                         *
                         * En el asunto de JOSE TOPACIO NUENO.
                         */
                        if (!jpRecoveredTitle) {

                            for (const x of windowLines) {

                                if (
                                    /^(?:MAKALINTAL|PABLO|REYES|FERNANDEZ|CONCEPCION|DIAZ|J\.|C\.J\.)[\s,:]/i.test(x)
                                ) {
                                    continue;
                                }

                                if (
                                    /^(?:PETITION|PETITION FOR|IN RE|IN THE MATTER|EN EL ASUNTO)\b/i.test(x) &&
                                    x.length <= 1800
                                ) {
                                    jpRecoveredTitle = x;
                                    break;
                                }

                                if (jpLooksLikeCaption(x)) {
                                    jpRecoveredTitle = x;
                                    break;
                                }
                            }
                        }
                    }

                    /*
                     * Same-line docket + date + caption.
                     */
                    if (
                        !jpRecoveredTitle &&
                        jpDocketIndex >= 0
                    ) {
                        const x = jpLines[jpDocketIndex];

                        const match =
                            x.match(
                                new RegExp(
                                    jpMonths +
                                    "\\s+\\d{1,2},\\s+\\d{4}\\s+(.+)$",
                                    "i"
                                )
                            );

                        if (match) {
                            const possible =
                                jpCaption(match[1]);

                            if (possible) {
                                jpRecoveredTitle =
                                    possible;
                            }
                        }
                    }

                    /*
                     * Last-resort source scan for records whose first docket
                     * is present but whose caption starts unusually early.
                     * Only scan before the next docket and never use generic
                     * Supreme Court headers.
                     */
                    if (
                        jpRecoveredNumber &&
                        !jpRecoveredTitle
                    ) {
                        const fallbackLines = [];

                        for (
                            let i = jpDocketIndex + 1;
                            i < Math.min(jpLines.length, jpDocketIndex + 25);
                            i++
                        ) {
                            const x = jpClean(jpLines[i]);

                            if (!x) continue;
                            if (jpExtractNumber(x)) break;
                            if (jpIsNoise(x)) continue;

                            fallbackLines.push(
                                jpStripDocketDate(x)
                            );
                        }

                        for (const x of fallbackLines) {
                            if (jpLooksLikeCaption(x)) {
                                jpRecoveredTitle = x;
                                break;
                            }
                        }
                    }

                    if (jpRecoveredNumber) {
                        displayNumber =
                            jpRecoveredNumber;
                    }

                    if (jpRecoveredTitle) {
                        description =
                            jpRecoveredTitle;
                    }
                }

                /*
                 * BULK DISPLAY-ONLY FIX FOR COURT OF APPEALS
                 * CA-G.R. DOCKET TITLES.
                 *
                 * Examples:
                 *   the Court of Appeals (CA) in CA-G.R. SP No. 02508-MIN. The CA had
                 *   the Court of Appeals (CA) in CA G.R. CEB-CR-HC No. 01271. The CA
                 *   the Court of Appeals (CA) in CA-G.R. CR. No. 38012. The assailed Decision
                 *
                 * Display as:
                 *   CA-G.R. SP No. 02508-MIN
                 *   the Court of Appeals (CA)
                 *
                 * Database unchanged.
                 */
                if (selectedType === "Jurisprudence") {
                    const caGrTitle =
                        String(law.title || "")
                            .replace(/\s+/g, " ")
                            .trim();

                    const caGrMatch =
                        caGrTitle.match(
                            /^(the Court of Appeals \(CA\)),?\s+in\s+(CA\s*-?\s*G\.?\s*-?\s*R\.?\s+[A-Z0-9]+\.?(?:-[A-Z0-9]+)*(?:\s+No\.?)?\s*\d+(?:-\d+)?(?:-MIN)?)/i
                        );

                    if (caGrMatch) {
                        displayNumber =
                            caGrMatch[2]
                                .replace(/\s+/g, " ")
                                .trim();

                        description =
                            caGrMatch[1]
                                .replace(/\s+/g, " ")
                                .trim();
                    }
                }

                /*
                 * BULK DISPLAY-ONLY FIX FOR PARTY + G.R. DOCKET TITLES
                 * WHERE OCR REMOVED THE COMMA BEFORE THE DOCKET.
                 *
                 * Examples:
                 *   SM INVESTMENTS G.R. No. 200901
                 *   SENATOR JINGGOY EJERCITO G.R. Nos. 212761-62
                 *   TASK FORCE ABONO-FIELD G.R. Nos. 229026-31
                 *
                 * Database unchanged.
                 */
                if (selectedType === "Jurisprudence") {
                    const jpPartyDocketTitle =
                        String(law.title || "")
                            .replace(/\s+/g, " ")
                            .trim();

                    const jpPartyDocketMatch =
                        jpPartyDocketTitle.match(
                            /^(.+?)\s+((?:G\.?\s*R\.?)\s+Nos?\.?\s+[A-Z0-9/~&()\-]+(?:\s*(?:-|–|—)\s*[A-Z0-9/~&()\-]+)?)[.,;:]?\s*$/i
                        );

                    if (jpPartyDocketMatch) {
                        const jpParty =
                            jpPartyDocketMatch[1]
                                .replace(/\s+/g, " ")
                                .trim();

                        const jpDocket =
                            jpPartyDocketMatch[2]
                                .replace(/~/g, "")
                                .replace(/\s+/g, " ")
                                .replace(/[.,;:]+$/, "")
                                .trim();

                        if (
                            jpParty.length >= 3 &&
                            !/^(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.?)\s+No/i.test(jpParty)
                        ) {
                            displayNumber = jpDocket;
                            description = jpParty;
                        }
                    }
                }

                /*
                 * BULK DISPLAY-ONLY FIX FOR JURISPRUDENCE TITLES
                 * THAT ARE ONLY A G.R. DOCKET.
                 *
                 * Recover the party caption from titleSource.
                 *
                 * Example:
                 *   G.R. Nos. 246760-61
                 *
                 * becomes:
                 *   G.R. Nos. 246760-61
                 *   SERMAN COOPERATIVE, ...
                 *
                 * Database unchanged.
                 */
                if (
                    selectedType === "Jurisprudence" &&
                    /^G\.?\s*R\.?\s+Nos?\.?\s+[A-Z0-9/~&()\-]+(?:\s*(?:-|–|—)\s*[A-Z0-9/~&()\-]+)?[.,;:]?\s*$/i.test(
                        String(law.title || "").trim()
                    )
                ) {
                    const jpDocketOnly =
                        String(law.title || "")
                            .replace(/~/g, "")
                            .replace(/\s+/g, " ")
                            .replace(/[.,;:]+$/, "")
                            .trim();

                    const jpSourceForDocketOnly =
                        String(law.titleSource || "")
                            .replace(/\r/g, "")
                            .trim();

                    const jpSourceLinesForDocketOnly =
                        jpSourceForDocketOnly
                            .split(/\n/)
                            .map(function (line) {
                                const element =
                                    document.createElement("textarea");
                                element.innerHTML = String(line || "");
                                return element.value
                                    .replace(/&nbsp;/gi, " ")
                                    .replace(/\s+/g, " ")
                                    .trim();
                            })
                            .filter(Boolean);

                    let jpCaptionFromSource = "";

                    for (
                        let i = 0;
                        i < jpSourceLinesForDocketOnly.length;
                        i++
                    ) {
                        const line =
                            jpSourceLinesForDocketOnly[i];

                        if (
                            /^G\.?\s*R\.?\s+Nos?\.?\s+/i.test(line)
                        ) {
                            continue;
                        }

                        if (
                            /^(?:FIRST|SECOND|THIRD|FOURTH|SPECIAL|EN BANC)\s+DIVISION$/i.test(line) ||
                            /^REPUBLIC OF THE PHILIPPINES$/i.test(line) ||
                            /^SUPREME COURT/i.test(line) ||
                            /^MANILA$/i.test(line) ||
                            /^BAGUIO CITY$/i.test(line)
                        ) {
                            continue;
                        }

                        if (
                            /\b(?:PETITIONER|PETITIONERS|COMPLAINANT|COMPLAINANTS)\b/i.test(line)
                        ) {
                            jpCaptionFromSource = line;
                            break;
                        }
                    }

                    if (jpCaptionFromSource) {
                        displayNumber = jpDocketOnly;
                        description = jpCaptionFromSource
                            .replace(/\s+/g, " ")
                            .trim();
                    }
                }

                /*
                 * BULK DISPLAY-ONLY FIX FOR TITLES THAT ALREADY CONTAIN
                 * THE PARTY NAME FOLLOWED BY A G.R. DOCKET.
                 *
                 * Example:
                 *     NEMENCIO C. PULUMBARIT, G.R. NOS. 153745-46
                 *
                 * Becomes:
                 *     G.R. Nos. 153745-46
                 *     NEMENCIO C. PULUMBARIT
                 *
                 * Database unchanged.
                 * law.number is never used as the public case number.
                 *
                 * Only titles with a non-empty party/caption before the
                 * G.R. docket are changed. Existing explicit ID fixes and
                 * the xgrno recovery block remain untouched.
                 */
                if (selectedType === "Jurisprudence") {
                    const jpTitleWithDocket =
                        String(law.title || "")
                            .replace(/\s+/g, " ")
                            .trim();

                    const jpTitleDocketMatch =
                        jpTitleWithDocket.match(
                            /^(.+?),\s*((?:G\.?\s*R\.?)\s+Nos?\.?\s+[A-Z0-9/~&()\-]+(?:\s*(?:-|–|—)\s*[A-Z0-9/~&()\-]+)?)(?=\s*[.,;:]?\s*$)[.,;:]?$/i
                        );

                    if (jpTitleDocketMatch) {
                        const jpPartyTitle =
                            jpTitleDocketMatch[1]
                                .replace(/\s+/g, " ")
                                .trim();

                        const jpPublicDocket =
                            jpTitleDocketMatch[2]
                                .replace(/\s+/g, " ")
                                .trim();

                        if (
                            jpPartyTitle.length >= 3 &&
                            !/^G\.?\s*R\.?\s+No/i.test(jpPartyTitle)
                        ) {
                            displayNumber = jpPublicDocket;
                            description = jpPartyTitle;
                        }
                    }
                }

                /*
                 * BULK DISPLAY-ONLY FIX FOR OCR PLACEHOLDER TITLES.
                 *
                 * Some Jurisprudence records have the database title:
                 *     G.R. No. xgrno
                 *
                 * Database remains unchanged.
                 *
                 * The card list receives titleSource from the runtime DB.
                 * Recover the real docket and party caption from that source.
                 */
                if (
                    selectedType === "Jurisprudence" &&
                    String(law.title || "").trim().toLowerCase() ===
                        "g.r. no. xgrno"
                ) {
                    const jpSourceText = String(
                        law.titleSource || ""
                    );

                    const jpSourceLines = jpSourceText
                        .replace(/\r/g, "")
                        .split(/\n+/)
                        .map(function (line) {
                            return line
                                .replace(/&nbsp;/gi, " ")
                                .replace(/<[^>]+>/g, " ")
                                .replace(/\s+/g, " ")
                                .trim();
                        })
                        .filter(Boolean);

                    const xgrnoDocketPattern =
                        /\b((?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.?)\s+No\.?\s+[A-Z0-9./~&()\-]+)/i;

                    const xgrnoBadLine =
                        /^(?:PHILIPPINE JURISPRUDENCE FULL TEXT|THE LAWP(?:H|H)IL PROJECT|REPUBLIC OF THE PHILIPPINES|SUPREME COURT|MANILA|BAGUIO CITY|EN BANC|FIRST DIVISION|SECOND DIVISION|THIRD DIVISION|FOURTH DIVISION|D E C I S I O N|D E C I S I O N|DISSENTING OPINION|SEPARATE CONCURRING OPINION|CONCURRING OPINION|RESOLUTION)$/i;

                    const xgrnoCaptionSignal =
                        /\b(?:Petitioner(?:s)?|Respondent(?:s)?|Complainant(?:s)?|Defendant(?:s)?|Plaintiff(?:s)?|Accused|Appellant(?:s)?|Appellee(?:s)?|Applicant(?:s)?)\b/i;

                    const xgrnoPartyRole =
                        /\b(?:Petitioner(?:s)?|Respondent(?:s)?|Complainant(?:s)?|Defendant(?:s)?|Plaintiff(?:s)?|Accused|Appellant(?:s)?|Appellee(?:s)?|Applicant(?:s)?)\s*,?\s*$/i;

                    const xgrnoVs =
                        /\b(?:-\s*)?(?:versus|vs\.?)\b/i;

                    function xgrnoClean(line) {
                        return String(line || "")
                            .replace(/\s+/g, " ")
                            .replace(/\s+([,.;:])/g, "$1")
                            .trim();
                    }

                    function xgrnoIsHeader(line) {
                        return (
                            !line ||
                            xgrnoBadLine.test(line) ||
                            /^x[-\s]+x$/i.test(line) ||
                            /^[-x\s]+$/i.test(line) ||
                            /^xcite$/i.test(line) ||
                            /^-->$/.test(line)
                        );
                    }

                    let xgrnoRecoveredNumber = "";
                    let xgrnoDocketIndex = -1;

                    /*
                     * Find the first REAL docket after the Lawphil header.
                     * Ignore the corrupt xgrno placeholder itself.
                     */
                    for (let i = 0; i < jpSourceLines.length; i++) {
                        const line = jpSourceLines[i];

                        if (!line || /xgrno/i.test(line)) {
                            continue;
                        }

                        const m = line.match(xgrnoDocketPattern);

                        if (!m) {
                            continue;
                        }

                        const candidate = xgrnoClean(m[1]);

                        if (
                            !candidate ||
                            /^G\.?\s*R\.?\s+No\.?\s*xgrno$/i.test(candidate)
                        ) {
                            continue;
                        }

                        /*
                         * The first valid docket in the document header is
                         * normally the Supreme Court case identifier.
                         */
                        xgrnoRecoveredNumber = candidate;
                        xgrnoDocketIndex = i;
                        break;
                    }

                    /*
                     * Recover the party caption immediately BEFORE the
                     * docket line. This avoids accidentally selecting prose
                     * from the body of the decision.
                     */
                    let xgrnoRecoveredTitle = "";

                    if (xgrnoDocketIndex >= 0) {
                        const captionLines = [];

                        for (
                            let i = xgrnoDocketIndex - 1;
                            i >= 0 && captionLines.length < 18;
                            i--
                        ) {
                            let line = xgrnoClean(jpSourceLines[i]);

                            if (!line || xgrnoIsHeader(line)) {
                                if (captionLines.length) {
                                    break;
                                }
                                continue;
                            }

                            /*
                             * Stop at the document metadata boundary.
                             */
                            if (
                                /^(?:Present:|Promulgated:|Date:)/i.test(line) ||
                                /^G\.?\s*R\.?\s+No\.?/i.test(line)
                            ) {
                                break;
                            }

                            /*
                             * Skip obvious judicial metadata.
                             */
                            if (
                                /^(?:Chairperson|Acting Chairperson|Associate Justice|Justice|JJ\.|J\.)$/i.test(line)
                            ) {
                                continue;
                            }

                            captionLines.unshift(line);

                            /*
                             * Once we have both sides of a normal caption,
                             * stop collecting.
                             */
                            const joinedSoFar =
                                captionLines.join(" ");

                            if (
                                xgrnoVs.test(joinedSoFar) &&
                                xgrnoCaptionSignal.test(joinedSoFar)
                            ) {
                                break;
                            }
                        }

                        let candidateTitle =
                            xgrnoClean(captionLines.join(" "));

                        /*
                         * A valid caption should contain a party role or a
                         * clear versus marker. Reject ordinary prose.
                         */
                        if (
                            candidateTitle.length >= 10 &&
                            candidateTitle.length <= 1800 &&
                            (
                                xgrnoCaptionSignal.test(candidateTitle) ||
                                xgrnoVs.test(candidateTitle)
                            ) &&
                            !/^(?:Republic of the Philippines|Supreme Court)/i.test(
                                candidateTitle
                            )
                        ) {
                            xgrnoRecoveredTitle = candidateTitle;
                        }
                    }

                    /*
                     * Some records place the docket on the SAME line as
                     * the beginning of the caption. Handle that case too.
                     */
                    if (
                        xgrnoDocketIndex >= 0 &&
                        !xgrnoRecoveredTitle
                    ) {
                        const docketLine =
                            xgrnoClean(
                                jpSourceLines[xgrnoDocketIndex]
                            );

                        const inlineMatch =
                            docketLine.match(
                                xgrnoDocketPattern
                            );

                        if (inlineMatch) {
                            let inlineTitle =
                                docketLine
                                    .slice(
                                        inlineMatch.index +
                                            inlineMatch[0].length
                                    )
                                    .replace(
                                        /^[\s:;,\-–—]+/,
                                        ""
                                    )
                                    .trim();

                            if (
                                inlineTitle.length >= 10 &&
                                xgrnoCaptionSignal.test(inlineTitle)
                            ) {
                                xgrnoRecoveredTitle = inlineTitle;
                            }
                        }
                    }

                    if (xgrnoRecoveredNumber) {
                        displayNumber = xgrnoRecoveredNumber;
                    }

                    if (xgrnoRecoveredTitle) {
                        description = xgrnoRecoveredTitle;
                    }
                }

                /*
                 * Display-only cleanup for nine verified Jurisprudence records.
                 * Database remains unchanged.
                 */
                if (selectedType === "Jurisprudence") {
                    const jurisprudenceDisplay = {
                        "jurisprudence-doc-2f73b9c1bb1f571ff1f7b562": {
                            displayNumber: "A.M. No. MTJ-00-1319",
                            title: "ROLANDO SULLA, complainant, vs. HON. RODOLFO C. RAMOS, Presiding Judge, 1st MCTC, San Miguel-Tunga, Leyte and MTC, Jaro, Leyte, respondent."
                        },
                        "jurisprudence-75787-e": {
                            displayNumber: "A.C. No. 3724",
                            title: "JOAQUIN G. GARRIDO, complainant, vs. ATTYS. RAMON J. QUISUMBING, GIL ROBERTO L. ZERRUDO, FERNANDO C. COJUANGCO, ANGEL M. ESGUERRA III and RICARDO P.C. CASTRO, JR., respondents."
                        },
                        "jurisprudence-9912": {
                            displayNumber: "A.C. No. 9912",
                            title: "DATU REMIGIO M. DUQUE JR., COMPLAINANT, VS. COMMISSION ON ELECTIONS CHAIRMAN SIXTO S. BRILLANTES, JR., COMMISSIONERS LUCENITO N. TAGLE, ELIAS R. YUSOPH, AND CHRISTIAN ROBERT S. LIM; ATTYS. MA. JOSEFINA E. DELA CRUZ, ESMERALDA A. AMORA-LADRA, MA. JUANA S. VALLEZA, SHEMIDAH G. CADIZ, AND FERNANDO F. COT-OM; AND PROSECUTOR NOEL S. ADION, RESPONDENTS."
                        },
                        "jurisprudence-203957": {
                            displayNumber: "A.C. No. 10557",
                            title: "DISSENTING OPINION"
                        },
                        "jurisprudence-doc-b27d7fd560ca5897d5e0b9a6": {
                            displayNumber: "A.C. Case No. 3195",
                            title: "MA. LIBERTAD SJ CANTILLER, complainant, vs. ATTY. HUMBERTO V. POTENCIANO, respondent."
                        },
                        "jurisprudence-50623": {
                            displayNumber: "A.C. CBD No. 471",
                            title: "LT. LAMBERTO P. VILLAFLOR, complainant, vs. ALVIN T. SARITA, respondent."
                        },
                        "jurisprudence-600": {
                            displayNumber: "A.C. No. 600-M.J",
                            title: "SOFRONIO G. BONJOC, complainant, vs. JUDGE MARIANO C. TUPAS, Bansalan, Davao del Sur, respondent."
                        },
                        "jurisprudence-doc-b989aa1b6c9b99d58287122f": {
                            displayNumber: "A.C. No. 141-J",
                            title: "SERGIO F. DEL CASTILLO, Complainant, v. HON. RAFAEL C. CLIMACO, Respondent."
                        },
                        "jurisprudence-doc-406c96156b71042c1b0e0be6": {
                            displayNumber: "A.C. No. 12485",
                            title: "NARCISO L. HIPOLITO, COMPLAINANT, VS. ATTY. MA. CARMINA M. ALEJANDRO-ABBAS AND ATTY. JOSEPH ANTHONY M. ALEJANDRO, RESPONDENTS."
                        }
                    };

                    const jurisprudenceFix =
                        jurisprudenceDisplay[String(law.id || "")];

                    if (jurisprudenceFix) {
                        displayNumber = jurisprudenceFix.displayNumber;
                        description = jurisprudenceFix.title;
                    }
                }

                /*
                 * Display-only cleanup for two verified 2019 Court Issuances.
                 * Database remains unchanged.
                 */
                if (selectedType === "Court Issuance") {
                    const court2019Display = {
            "court-issuance-doc-27628531e22415e1e308a772": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 2-92",
                title: "CANCELLATION OF BAIL BOND OF ACCUSED CONVICTED OF CAPITAL OFFENSE IN THE REGIONAL TRIAL COURT"
            },

            "court-issuance-doc-247b65200ca5e379fa37993d": {
                displayNumber: "A.M. NO. 02-8-11-SC",
                title: "RE: REORGANIZATION OF THE DIVISION OF THE COURT"
            },

            "court-issuance-doc-28ceae0e070c8406043b95dd": {
                displayNumber: "A.M. NO. 02-11-11-SC",
                title: "RULE ON LEGAL SEPARATION"
            },

            "court-issuance-doc-2e213d774e62880c117fb669": {
                displayNumber: "CIRCULAR NO. 23-91",
                title: "ADDITIONAL REQUISITES FOR PETITIONS FILED WITH THE SUPREME COURT AND THE COURT OF APPEALS TO PREVENT FORUM SHOPPING OR MULTIPLE FILING OF PETITIONS AND COMPLAINTS"
            },

            "court-issuance-doc-2adfb4dffa9647f938a48d5d": {
                displayNumber: "A.M. NO. 10-4-1-SC",
                title: "THE 2010 RULES OF PROCEDURE FOR MUNICIPAL ELECTION CONTESTS"
            },

            "court-issuance-doc-23c552c97f7b6147323e97cd": {
                displayNumber: "A.M. NO. 02-11-10-SC",
                title: "RULE ON DECLARATION OF ABSOLUTE NULLITY OF VOID MARRIAGES AND ANNULMENT OF VOIDABLE MARRIAGES"
            },

            "court-issuance-doc-2212ff50679b36dbcd1f0831": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 1-2001",
                title: "SUBMISSION OF LISTS OF CASES FILED/RAFFLED, DISPOSED, ARCHIVED, TRANSFERRED/RERAFFLED, AND WITH SUSPENDED PROCEEDINGS"
            },

            "court-issuance-doc-213fb3b60095164ce19025ea": {
                displayNumber: "A.M. NO. 99-2-02-SC",
                title: "IN RE: DENIAL OF APPEAL FROM ANY DECISION OR FINAL RESOLUTION OR ORDER OF THE OMBUDSMAN IN ADMINISTRATIVE CASES AND DISMISSAL OF SPECIAL CIVIL ACTION RELATIVE TO SUCH DECISION, RESOLUTION OR ORDER"
            },

            "court-issuance-doc-2002cec6d5c43777eff84bf0": {
                displayNumber: "A.M. NO. 99-2-03-SC",
                title: "IN RE: EXTENSION OF TIME TO FILE COMMENT OR APPELLEE'S BRIEF BY THE OFFICE OF THE SOLICITOR GENERAL"
            },

            "court-issuance-doc-1f5a00d45cd6d7e28cfd9217": {
                displayNumber: "CIRCULAR NO. 42-93",
                title: "ISSUANCE OF MITTIMUS/COMMITMENT ORDER"
            },

            "court-issuance-doc-1d5ac21ea865d0f56a82f863": {
                displayNumber: "A.M. NO. 02-6-13-CA",
                title: "RE: PROPOSED 2002 INTERNAL RULES OF THE COURT OF APPEALS"
            },

            "court-issuance-doc-1a4dc4d4dc2cd23718602134": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 29",
                title: "REGULAR DIALOGUES/CONFERENCES ON CONCILIATION OF DISPUTES"
            },

            "court-issuance-doc-1777f81d8328186849c2808c": {
                displayNumber: "A.M. NO. 99-10-05-0",
                title: "PROCEDURE IN EXTRA-JUDICIAL FORECLOSURE OF MORTGAGE"
            },

            "court-issuance-doc-173107e97b9cb02b6efc3481": {
                displayNumber: "CIRCULAR NO. 14",
                title: "SUPREME COURT CIRCULARS AND ORDERS"
            },

            "court-issuance-doc-16bd7dc5a808397ff809fe27": {
                displayNumber: "A.M. NO. 10-4-20-SC",
                title: "THE INTERNAL RULES OF THE SUPREME COURT"
            },

            "court-issuance-doc-158e25fa485f5282e7b56439": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 3-99",
                title: "STRICT OBSERVANCE OF SESSION HOURS OF TRIAL COURTS AND EFFECTIVE MANAGEMENT OF CASES TO ENSURE THEIR SPEEDY DISPOSITION"
            },

            "court-issuance-doc-141eea279ace1672823d1013": {
                displayNumber: "CIRCULAR NO. 71-97",
                title: "SERVICE OF NOTICES, MOTIONS, ORDERS, JUDGMENTS AND OTHER PAPERS IN LAND REGISTRATION CASES"
            },

            "court-issuance-doc-10353c3f500e069b7ba35712": {
                displayNumber: "A.M. NO. 99-2-04-SC",
                title: "IN RE: DISPENSING WITH REJOINDER"
            },

            "court-issuance-doc-0f96cfed06d20b8f7da2b275": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 28-91",
                title: "PROHIBITION ON COLLECTING LEGAL FEES FOR PREPARING OR NOTARIZING COMPLAINTS OR AFFIDAVITS IN CRIMINAL CASES"
            },

            "court-issuance-doc-0970360a00bf30256a7d4455": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 37-93",
                title: "AMENDMENT TO MANUAL FOR CLERKS OF COURT RE: DELEGATION OF RECEPTION OF EVIDENCE IN CASE OF DEFAULT"
            },

            "court-issuance-doc-048f48a75e9743f292208984": {
                displayNumber: "A.M. NO. 19-10-20-SC",
                title: "2019 AMENDMENTS TO THE 1997 RULES OF CIVIL PROCEDURE"
            },
    "court-issuance-doc-00f8c97d1f71e48dcd659f85": {
        displayNumber: "RULE 138",
        title: "PRACTICE OF LAW"
    },

    "court-issuance-doc-322e9079c84eebaa47083b8c": {
        displayNumber: "RULES 110-127",
        title: "1985 CRIMINAL PROCEDURE"
    },

    "court-issuance-doc-10c90703871ec78d6fa7f0f2": {
        displayNumber: "RULES OF COURT",
        title: ""
    },

    "court-issuance-doc-08149541999d89ff857fc25f": {
    displayNumber: "CIRCULAR NO. 20",
    title: "AMENDMENT TO PARAGRAPH III, SUBPARAGRAPH 2 OF CIRCULAR NO. 7, DATED SEPTEMBER 23, 1974, RE-RAFFLE OF CASES"
},
"court-issuance-doc-00840b01c377b4a16a3132b1": {
        displayNumber: "A.M. NO. 99-12-08-SC",
        title: "REFERRAL OF ADMINISTRATIVE MATTERS AND CASES TO THE DIVISIONS OF THE COURT"
    },

    "court-issuance-doc-01cb2afd071ce3b35f158c76": {
        displayNumber: "CIRCULAR NO. 2-89",
        title: "GUIDELINES AND RULES IN THE REFERRAL TO THE COURT EN BANC OF CASES ASSIGNED TO A DIVISION"
    },

    "court-issuance-doc-02f62ef74a4687d37b79958f": {
        displayNumber: "SUPERVISORY CIRCULAR NO. 22",
        title: "SERVICE OF SUMMONS AND OTHER COURT PROCESSES"
    },

    "court-issuance-doc-0453cc40a48a8fa36199ee0e": {
        displayNumber: "CIRCULAR NO. 12",
        title: "GUIDELINES ON ISSUANCE OF WARRANTS OF ARRESTS UNDER SECTION 2, ARTICLE III, 1987 CONSTITUTION"
    },

    "court-issuance-doc-2179d2c66e029e5091375b23": {
        displayNumber: "RULE 137",
        title: "DISQUALIFICATION OF JUDICIAL OFFICERS"
    },

    "court-issuance-doc-268cf3ad40e324c022ca83ff": {
        displayNumber: "RULE 139-B",
        title: "DISBARMENT AND DISCIPLINE OF ATTORNEYS"
    },

    "court-issuance-doc-635208a8122789323287bc14": {
        displayNumber: "RULE 139",
        title: "DISBARMENT OR SUSPENSION OF ATTORNEYS"
    },

    "court-issuance-doc-a7a3fc6aff47d317d4faa38c": {
        displayNumber: "RULE 136",
        title: "COURT RECORD AND GENERAL DUTIES OF CLERK AND STENOGRAPHERS"
    },

    "court-issuance-doc-ac79f3a1ee6b64b8849e3275": {
        displayNumber: "RULE 139-A",
        title: "INTEGRATED BAR OF THE PHILIPPINES"
    },

    "court-issuance-doc-f87f5cf7eb32f61fc096311b": {
        displayNumber: "RULES 72-109",
        title: "SPECIAL PROCEEDINGS"
    },

    "court-issuance-doc-86d059e0256a446080c8918d": {
        displayNumber: "FORM 1-SCC",
        title: "STATEMENT OF CLAIM"
    },

    "court-issuance-doc-e177c37fa8403adfd1a84a4c": {
        displayNumber: "RULES 1-71",
        title: "REVISED RULES ON CIVIL PROCEDURE"
    },

    "court-issuance-doc-0f5ff2ce7ff4404e85466a16": {
        displayNumber: "1918 RULES OF COURT - PHILIPPINE ISLANDS",
        title: ""
    },

    "court-issuance-doc-bbc6137de11024d54cf22d81": {
        displayNumber: "1964 RULES OF COURT - PHILIPPINES",
        title: ""
    },

    "court-issuance-doc-7dfc3ea239fb46ea8943d29e": {
        displayNumber: "RULE 138-A",
        title: "LAW STUDENT PRACTICE"
    },


    "court-issuance-doc-5d7a234e9e3c50ce18294540": {
        displayNumber: "RULE 138-A",
        title: "LAW STUDENT PRACTICE"
    },


    "court-issuance-doc-30795a006a031cf7fb2191ce": {
        displayNumber: "RULE 138-A",
        title: "LAW STUDENT PRACTICE"
    },


    "court-issuance-doc-ae83dca46ffa71d81bfcf0fe": {
        displayNumber: "RULE 135",
        title: "POWERS AND DUTIES OF COURTS AND JUDICIAL OFFICERS"
    },

    "court-issuance-doc-91733a1f022f4a62e5ec505e": {
        displayNumber: "A.M. NO. 02-6-02-SC",
        title: "RULE ON ADOPTION"
    },

                        "court-issuance-doc-37b1f3723eb9a64814e93e46": {
    displayNumber: "A.M. NO. 08-8-7-SC",
    title: "RULE OF PROCEDURE FOR SMALL CLAIMS CASES"
},
"court-issuance-doc-36fec3d319a1ae052d490608": {
    displayNumber: "ADMINISTRATIVE CIRCULAR NO. 3-92",
    title: "PROHIBITION AGAINST USE OF HALLS OF JUSTICE FOR RESIDENTIAL AND COMMERCIAL PURPOSES"
},
"court-issuance-doc-36644845d435e2e05be67c87": {
    displayNumber: "A.M. NO. 02-11-09-SC",
    title: "AMENDMENT OF THE REVISED RULE ON SUMMARY PROCEDURE"
},
"court-issuance-doc-2e55b89e476a637dc2919ef5": {
                            displayNumber: "A.M. NO. 19-08-15-SC",
                            title: "2019 AMENDMENTS TO THE 1989 REVISED RULES ON EVIDENCE"
                        },
                        "court-issuance-doc-55a243bfddde1c8029836d6b": {
                            displayNumber: "A.M. NO. 19-10-20-SC",
                            title: "2019 AMENDMENTS TO THE 1997 REVISED RULES OF CIVIL PROCEDURE"
                        },
                        "court-issuance-doc-9d307787a943464d157554f4": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 10",
                            title: "DISPOSAL AND/OR DESTRUCTION OF COURT RECORDS, PAPERS AND EXHIBITS"
                        },
                        "court-issuance-doc-ecdad6410061538f1e9a7f7e": {
                            displayNumber: "A.M. NO. 24-10-05-SC",
                            title: "2025 PROPOSED AMENDMENTS TO RULE 138 OF THE RULES OF COURT"
                        },
                        "court-issuance-doc-5d9aaebc3d78e7b205ff557d": {
                            displayNumber: "A.M. NO. 19-10-16-SC",
                            title: "RULES AND REGULATIONS IN THE CONDUCT OF MCLE ONLINE"
                        },
                        "court-issuance-doc-7b53895d9f28d0211e49d53b": {
                            displayNumber: "MEMORANDUM ORDER",
                            title: "REVISED SCHEDULE OF WORKING HOURS"
                        },
                        "court-issuance-doc-371580e394c5fc236cb5032e": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 25",
                            title: "USE OF BLACK ROBES BY TRIAL JUDGES"
                        },
                        "court-issuance-doc-e33bcda9a0bee135d11a9bfe": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 3",
                            title: "PROCEDURE IN EXTRA-JUDICIAL FORECLOSURE OF MORTGAGE"
                        },
                        "court-issuance-doc-9871ef79442421bda9ad4a61": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 31-90",
                            title: "RE: GUIDELINES FOR ALLOCATING THE LEGAL FEES COLLECTED UNDER RULE 141, AS REVISED, BETWEEN THE GENERAL FUND AND THE JUDICIARY DEVELOPMENT FUND"
                        },
                        "court-issuance-doc-a712551cc9deba391a46d4a3": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 35",
                            title: "INCREASE IN THE NUMBER OF COURTS CONDUCTING MANDATORY CONTINUOUS TRIAL"
                        },
                        "court-issuance-doc-ebb081b832f6712aac130ff3": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 56",
                            title: "LETTER-DIRECTIVE OF MAJOR GEN. OF THE ARMED FORCES OF THE PHILIPPINES (AFP), RAMON E. MONTANO, ON COURT APPEARANCE OF PC/INP PERSONNEL"
                        },
                        "court-issuance-doc-f594864f21eb101462a6ea9f": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 08",
                            title: "CLARIFYING AND MODIFYING CERTAIN RULES OF PROCEDURE"
                        },
                        "court-issuance-doc-e6a25163b5bbf40ac472f1fd": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 09",
                            title: "RE: AMENDING SECTION 7 (A), RULE II OF ADMINISTRATIVE ORDER NO. 07"
                        },
                        "court-issuance-doc-f6ff0375e087106ccceb6cb0": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 141-2008",
                            title: "DESIGNATION OF PILOT COURTS FOR SMALL CLAIMS CASES"
                        },
                        "court-issuance-doc-7a8f85807fa27044da1264ce": {
            displayNumber: "RULES 129-134",
            title: "EVIDENCE"
        },
        "court-issuance-doc-5f4328e1f11c6378cb33179a": {
            displayNumber: "RULES 142-144",
            title: "COSTS"
        },
        "court-issuance-doc-5c513570894745c60d5557da": {
            displayNumber: "RULE 140",
            title: "CHARGES AGAINST JUDGES OF FIRST INSTANCE"
        },
        "court-issuance-doc-e38b70bc3dd7fda02be6320d": {
            displayNumber: "RULE 141",
            title: "LEGAL FEES"
        },
                        "court-issuance-doc-be42a871f87ad61dd9246fa5": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 3",
                            title: "DEFINING THE TERRITORIAL JURISDICTION OF THE REGIONAL TRIAL COURTS IN THE NATIONAL CAPITAL JUDICIAL REGION"
                        },
                        "court-issuance-doc-1ff1b552d6268046dbe4336d": {
                displayNumber: "A.M. NO. 19-03-24-SC",
                title: "RULE 138-A — LAW STUDENT PRACTICE"
            },
            "court-issuance-doc-ae56092c5bd269adf84ae100": {
                displayNumber: "A.M. NO. 20-06-14-SC",
                title: "GUIDELINES IN THE IMPOSITION OF COMMUNITY SERVICE AS PENALTY IN LIEU OF IMPRISONMENT"
            },
            "court-issuance-doc-c7a7c66a14db6afcd80cf42f": {
                displayNumber: "A.M. NO. 10-3-10-SC",
                title: "2020 REVISED RULES OF PROCEDURE FOR INTELLECTUAL PROPERTY RIGHTS CASES"
            },
            "court-issuance-doc-4b073f3886f52a729328136c": {
                displayNumber: "A.M. NO. 19-12-02-SC",
                title: "RULES ON LIQUIDATION OF CLOSED BANKS"
            },
            "court-issuance-doc-416f2abdfcef7ceaadbd593a": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 5-90",
                title: "EXPEDITIOUS DISPOSITION OF CASES INVOLVING TOURISTS"
            },
            "court-issuance-doc-41cfba56f705d1e0a79c16d0": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 1-95",
                title: "RULES GOVERNING APPEALS TO THE COURT OF APPEALS FROM JUDGMENTS OR FINAL ORDERS OF THE COURT OF TAX APPEALS AND QUASI-JUDICIAL AGENCIES"
            },
            "court-issuance-doc-445f0e2a19aba30dbafb6528": {
                displayNumber: "A.M. NO. 08-8-7-SC",
                title: "RULE OF PROCEDURE FOR SMALL CLAIMS CASES"
            },
            "court-issuance-doc-44ee57cb428006469efe5eb2": {
                displayNumber: "CIRCULAR NO. 11",
                title: "REMINDER TO STRICTLY COMPLY WITH THE PROVISIONS OF RULE 136 OF THE RULES OF COURT"
            },
            "court-issuance-doc-44ff5f291fc55e592a0c6c28": {
                displayNumber: "CIRCULAR NO. 19",
                title: "STUDENT PRACTICE"
            },
            "court-issuance-doc-4516c4cb59acc587136620af": {
                displayNumber: "MEMORANDUM CIRCULAR NO. 1-93",
                title: "INSURANCE MEMORANDUM RULES OF PROCEDURE GOVERNING ADMINISTRATIVE CASES BEFORE THE INSURANCE COMMISSION"
            },
            "court-issuance-doc-4637381fba3067237fba80b3": {
                displayNumber: "CIRCULAR NO. 12",
                title: "ADOPTION CASES"
            },
            "court-issuance-doc-46aa92c8ecbadb05d6463f4c": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 6"
            },
            "court-issuance-doc-4726db8b33b013361641198c": {
                displayNumber: "A.M. NO. 00-8-10-SC"
            },
            "court-issuance-doc-47617ddff9c80b5cfe7abdaf": {
                displayNumber: "CIRCULAR NO. 62-97",
                title: "RULES AND REGULATIONS ON TEACHING"
            },
            "court-issuance-doc-4806c41d0a7e88a327e93268": {
                displayNumber: "MEMORANDUM CIRCULAR NO. 10-84"
            },
            "court-issuance-doc-4808ccae529ee1fecdcb5d90": {
                displayNumber: "CIRCULAR NO. 9",
                title: "NON-IMPOSITION OF THE DEATH PENALTY"
            },
            "court-issuance-doc-483f35d4ced424845ced8b87": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 1-A",
                title: "ADMINISTRATIVE CIRCULAR NO. 1, DATED JANUARY 28, 1988 (RE: 1, EFFECTIVE DOCKET CONTROL, PAR. 1.2)"
            },
            "court-issuance-doc-4c20953afe7597ab3eb2908e": {
                displayNumber: "A.M. NO. 02-1-06-SC"
            },
            "court-issuance-doc-4c4c3337e7580eed466ce8fc": {
                displayNumber: "CIRCULAR NO. 13",
                title: "GUIDELINES IN THE ADMINISTRATION OF JUSTICE"
            },
            "court-issuance-doc-4c9c1f25bcf8a7c7830e3764": {
                displayNumber: "A.M. NO. 02-8-13-SC",
                title: "2004 RULES ON NOTARIAL PRACTICE"
            },
            "court-issuance-doc-4dd93c817dac034362b01e1c": {
                displayNumber: "CIRCULAR NO. 12-99",
                title: "GRANTING INCENTIVES TO JUDGES WHO ARE GIVEN ADDITIONAL DUTY OF HEARING AND DECIDING CASES OF OTHER BRANCHES OF THEIR COURTS OR OF OTHER COURTS OF THE SAME LEVEL"
            },
            "court-issuance-doc-4ec7de2bdbaf4135cb7967da": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 68-94",
                title: "STRICT OBSERVANCE OF SECTION 1 OF P.D. 1818 ENVISIONED BY CIRCULAR NO. 13-93 DATED MARCH 5, 1993 AND CIRCULAR NO. 20-92 DATED MARCH 24, 1992"
            },
            "court-issuance-doc-4ed7eba9ad1f28548b628eaa": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 3-2001",
                title: "DISPLAY OF COURT CALENDAR"
            },
            "court-issuance-doc-51f73a236d1dbbd940160a7e": {
                displayNumber: "A.M. NO. 00-8-10-SC"
            },
            "court-issuance-doc-5257430253d8f2ffb07c5f64": {
                displayNumber: "A.M. NO. 03-04-04-SC",
                title: "CUSTODY OF MINORS AND WRIT OF HABEAS CORPUS IN RELATION THERETO"
            },
            "court-issuance-doc-54f9e6a477b261a42171adbb": {
                displayNumber: "A.M. NO. 01-2-04-SC"
            },
            "court-issuance-doc-56c3e51851512b504350bf1b": {
                displayNumber: "CIRCULAR NO. 5",
                title: "SPECIAL RULES IN CRIMINAL PROCEEDINGS INVOLVING YOUTHFUL OFFENDERS"
            },
            "court-issuance-doc-56ff21707bea07abf43f6912": {
                displayNumber: "CIRCULAR NO. 7"
            },
            "court-issuance-doc-59e376ba134fa1356b429a5f": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 07-99",
                title: "EXERCISE OF UTMOST CAUTION, PRUDENCE, AND JUDICIOUSNESS IN ISSUANCE OF TEMPORARY RESTRAINING ORDERS AND WRITS OF PRELIMINARY INJUNCTIONS"
            },
            "court-issuance-doc-5b77c560f461463654f685bd": {
                displayNumber: "CIRCULAR NO. 7",
                title: "PAIRING SYSTEM IN THE REGIONAL TRIAL COURTS"
            },
            "court-issuance-doc-5d6338382fe4f002639f4ea6": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 43-90",
                title: "ACCREDITATION OF NEWSPAPERS (ABOLITION OF COUNCIL FOR PRINT MEDIA)"
            },
            "court-issuance-doc-5fe461ff1ae7aa6a9f4ee75c": {
                displayNumber: "A.M. NO. 09-6-8-SC",
                title: "THE RULES OF PROCEDURE FOR ENVIRONMENTAL CASES"
            },
            "court-issuance-doc-617afc80194bd6fc11321e16": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 57",
                title: "ISSUANCE OF CERTIFIED TRUE COPIES OF DECISIONS AND ORDERS"
            },
            "court-issuance-doc-63538d432947c1df5aa95e62": {
                displayNumber: "CIRCULAR NO. 2-90",
                title: "GUIDELINES TO BE OBSERVED IN APPEALS TO THE COURT OF APPEALS AND TO THE SUPREME COURT"
            },
            "court-issuance-doc-64e17da75470aa1de93b1a80": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 6-A-92",
                title: "THE CORRECT APPLICATION OF THE PENALTIES OF RECLUSION PERPETUA AND LIFE IMPRISONMENT"
            },
            "court-issuance-doc-656a0833a49aa102ed47c8d4": {
                displayNumber: "CIRCULAR NO. 3-91",
                title: "SERVICE OF WRITS AND COURT PROCESSES IN CONNECTION WITH CASES INVOLVING FOREIGN GOVERNMENTS OR INSTRUMENTALITIES THEREOF"
            },
            "court-issuance-doc-66dd621f6232f75986b2ed1c": {
                displayNumber: "CIRCULAR NO. 38-98",
                title: "IMPLEMENTATION OF THE SPEEDY TRIAL ACT OF 1998"
            },
            "court-issuance-doc-6758ea46b056ac7d683afc07": {
                displayNumber: "CIRCULAR NO. 2",
                title: "CONTINUANCE OF REGULAR COURT SESSIONS AND JUDICIAL FUNCTIONS"
            },
            "court-issuance-doc-6a1a35ceb5a9a0f204ed92f0": {
                displayNumber: "A.M. NO. 02-11-12-SC",
                title: "RULE ON PROVISIONAL ORDERS"
            },
            "court-issuance-doc-6a8e894d5650533e35ccd2c3": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 8-93",
                title: "PREPARATION AND SUBMISSION OF QUARTERLY REPORT OF CASES, IN LIEU OF THE MONTHLY REPORT OF CASES, TO THE SUPREME COURT"
            },
            "court-issuance-doc-6aa882d9210da862eeabd851": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 16-93",
                title: "PROCEDURE AFTER AFFIRMANCE OR MODIFICATION BY SUPREME COURT OR COURT OF APPEALS OF JUDGMENTS OF CONVICTION IN CRIMINAL CASES"
            },
            "court-issuance-doc-6b5281d893388216d03476f0": {
                displayNumber: "A.M. NO. 99-8-09-SC",
                title: "RULES ON WHO SHALL RESOLVE MOTIONS FOR RECONSIDERATION IN CASES ASSIGNED TO THE DIVISIONS OF THE COURT."
            },
            "court-issuance-doc-6b960eceb15b29bebf385bce": {
                displayNumber: "A.M. NO. 02-8-2-SC",
                title: "RE: PROPOSED RULES REQUIRING NOTARIES PUBLIC TO HOLD OFFICE AT A SPECIFIC AND APPROPRIATE ADDRESS/ADDRESSES"
            },
            "court-issuance-doc-6d9bfd1a87365359d0fa8657": {
                displayNumber: "A.M. NO. 05-11-07-CTA",
                title: "REVISED RULES OF THE COURT OF TAX APPEALS (RRCTA)"
            },
            "court-issuance-doc-70e9d945bc102b0407fd1792": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 24-90",
                title: "REVISED RULES ON TRANSCRIPTION OF STENOGRAPHIC NOTES AND THEIR TRANSMISSION TO APPELLATE COURT"
            },
            "court-issuance-doc-711737c0fbd5a45a9637f29d": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 11-94",
                title: "AMENDMENTS TO SECTION 7 (a) AND (d) AND SECTION 8 (a) AND (b), RULE 141, RULES OF COURT, AS LAST AMENDED ON SEPTEMBER 4, 1990, AND EFFECTIVE NOVEMBER 2, 1990, IN VIEW OF THE EXPANDED JURISDICTION OF THE LOWER COURTS"
            },
            "court-issuance-doc-7285de37b39def09a070fac2": {
                displayNumber: "A.M. NO. 12-8-8-SC",
                title: "JUDICIAL AFFIDAVIT RULE"
            },
            "court-issuance-doc-72a7b0e1cdfdfe2c2ea4acb9": {
                displayNumber: "CIRCULAR NO. 22",
                title: "SERVICE OF WRITS AND COURT PROCESSES IN CONNECTION WITH CASES INVOLVING FOREIGN GOVERNMENTS OR INSTRUMENTALITIES THEREOF"
            },
            "court-issuance-doc-74f3b3d50e4d38f373a7b7cd": {
                displayNumber: "A.M. NO. 07-4-15-SC",
                title: "RULES OF PROCEDURE IN ELECTION CONTESTS BEFORE THE COURTS INVOLVING ELECTIVE MUNICIPAL AND BARANGAY OFFICIALS"
            },
            "court-issuance-doc-75cc9f99e864c821347e8313": {
                displayNumber: "ADMINISTRATIVE CIRCULAR NO. 12",
                title: "GUIDELINES AND PROCEDURE IN THE SERVICE AND EXECUTION OF COURT WRITS AND PROCESSES IN THE REORGANIZED COURTS"
            },
            "court-issuance-doc-75deb8cb3244f821538de57e": {
                displayNumber: "CIRCULAR NO. 59-94",
                title: "COLLECTION AND REMITTANCE OF THE VICTIM COMPENSATION FEE OF FIVE (P5.00) PESOS"
            },
            "court-issuance-doc-76254bdbcc2f4a53b7c31d14": {
                displayNumber: "A.M. NO. 02-1-18-SC",
                title: "RULE ON JUVENILES IN CONFLICT WITH THE LAW"
            },
            "court-issuance-doc-441d40a534dade184fd55514": {
                            displayNumber: "SUPERVISORY CIRCULAR NO. 14",
                            title: "SESSION HOURS OF COURTS"
                        },
                        "court-issuance-doc-b5c32fb933d3c49c74cbc36d": {
                            displayNumber: "REVISED CIRCULAR NO. 28-91",
                            title: "ADDITIONAL REQUISITES FOR PETITIONS FILED WITH THE SUPREME COURT AND THE COURT OF APPEALS TO PREVENT FORUM SHOPPING OR MULTIPLE FILING OF PETITIONS AND COMPLAINTS"
                        },
                        "court-issuance-doc-b7a72154b14445f1be9344da": {
                            displayNumber: "REVISED CIRCULAR NO. 1-88",
                            title: "IMPLEMENTATION OF SEC. 12, ART. XVIII OF THE 1987 CONSTITUTION AND COMPLEMENTING ADMINISTRATIVE CIRCULAR NO. 1 OF JANUARY 28, 1988 ON EXPEDITIOUS DISPOSITION OF CASES PENDING IN THE SUPREME COURT"
                        },
                        "court-issuance-doc-ba660cfd9de66c22d8ab4b1c": {
                            displayNumber: "REVISED CIRCULAR NO. 1-88",
                            title: "IMPLEMENTATION OF SEC. 12, ART. XVIII OF THE 1987 CONSTITUTION AND COMPLEMENTING ADMINISTRATIVE CIRCULAR NO. 1 OF JANUARY 28, 1988 ON EXPEDITIOUS DISPOSITION OF CASES PENDING IN THE SUPREME COURT"
                        },
                        "court-issuance-doc-9258c870583c265211ad2f2c": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 6",
                            title: "TO PROVIDE A MORE EFFECTIVE AND EFFICIENT MANAGEMENT OF LOWER COURTS, THE FOLLOWING GUIDELINES ON THE SELECTION, DESIGNATION, POWERS AND DUTIES OF THE EXECUTIVE JUDGE OF COURTS OF FIRST INSTANCE ARE HEREBY PROMULGATED"
                        },
                        "court-issuance-doc-0dfb0da95ebefb2a55722f4e": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 07",
                            title: "RULES OF PROCEDURE OF THE OFFICE OF THE OMBUDSMAN"
                        },
                        "court-issuance-doc-801fe0660bbb24adb419e3c4": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 13",
                            title: "GUIDELINES IN THE HANDLING AND PROSECUTION OF OMBUDSMAN CASES FILED WITH OR PENDING BEFORE REGULAR COURTS PURSUANT TO THE PROVISIONS OF REPUBLIC ACT NO. 7975"
                        },
                        "court-issuance-doc-18ce7bb6dfad8718960bf26e": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 19-97",
                            title: "AMENDMENT OF ADMINISTRATIVE ORDER NO. 134-92 RE: PAIRING SYSTEM FOR SINGLE SALA STATIONS"
                        },
                        "court-issuance-doc-207c8fbfc7a4e270265c5c0c": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 35-96",
                            title: "ESTABLISHMENT OF THE PHILIPPINE JUDICIAL ACADEMY (PHILJA)"
                        },
                        "court-issuance-doc-5da0d24ca60ca243e3c34d1a": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 36-96",
                            title: "SUPPLEMENT TO THE RAFFLE PROCEDURE UNDER CIRCULAR NO. 7, ADMINISTRATIVE ORDER NO. 6 AND ADMINISTRATIVE CIRCULAR NO. 1"
                        },
                        "court-issuance-doc-3a29f1a7705ac563f6044f7d": {
                            displayNumber: "A.M. NO. 05-11-06-SC",
                            title: "THE 2005 RULES OF THE PRESIDENTIAL ELECTORAL TRIBUNAL"
                        },
                        "court-issuance-doc-3d4a11190835550a552880b7": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 28",
                            title: "SUBMISSION OF MEMORANDA"
                        },
                        "court-issuance-doc-3dca9d8073a0297ea6b9a2e3": {
                            displayNumber: "CIRCULAR NO. 2-91",
                            title: "PRESIDENTIAL DECREE NO. 1818"
                        },
                        "court-issuance-doc-3fe338cc42c45ea18c1e988f": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 59",
                            title: "SERVICE OF SUMMONS"
                        },
                        "court-issuance-doc-3c04cd0efb6c2215493d898a": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 51-96",
                            title: "SPECIAL COURTS FOR KIDNAPPING, ROBBERY, DANGEROUS DRUGS, CARNAPPING AND OTHER HEINOUS CRIMES UNDER R.A. NO. 7659"
                        },
                        "court-issuance-doc-e2d5e93d7d914a96cebfaa9f": {
                            displayNumber: "ADMINISTRATIVE ORDER NO. 134-92",
                            title: "PAIRING SYSTEM FOR SINGLE SALA STATIONS"
                        },
                        "court-issuance-doc-93084ede1a5b5c6f1d56d085": {
                            displayNumber: "ADMINISTRATIVE CIRCULAR NO. 1",
                            title: "IMPLEMENTATION OF SEC. 12, ART. XVIII OF THE 1987 CONSTITUTION"
                        },
                        "court-issuance-doc-a8c7f670bea59e0b369d3231": {
                            displayNumber: "RULES 110-127",
                            title: "CRIMINAL PROCEDURE"
                        },
                        "court-issuance-doc-6d3f7ca01ec092531352acec": {
                            displayNumber: "RULES 110-127",
                            title: "CRIMINAL PROCEDURE"
                        }
                    };

                    const fixedCourt2019 =
                        court2019Display[String(law.id || "")];

                    if (fixedCourt2019) {
                        if (fixedCourt2019.displayNumber) {
                            displayNumber = fixedCourt2019.displayNumber;
                        }
                        description = fixedCourt2019.title;
                    }
                }

                /*
                 * Display-only cleanup:
                 * Hide Lawphil index/page artifacts incorrectly imported
                 * as Memorandum Circular records.
                 * Database remains unchanged.
                 */
                const mcLawphilArtifacts = new Set([
                    "memorandum-circular-1027",
                    "memorandum-circular-11",
                    "memorandum-circular-1108",
                    "memorandum-circular-1178",
                    "memorandum-circular-1206",
                    "memorandum-circular-1228",
                    "memorandum-circular-1250",
                    "memorandum-circular-1268",
                    "memorandum-circular-1273",
                    "memorandum-circular-1295",
                    "memorandum-circular-223",
                    "memorandum-circular-309",
                    "memorandum-circular-42-a",
                    "memorandum-circular-421",
                    "memorandum-circular-52",
                    "memorandum-circular-525",
                    "memorandum-circular-612",
                    "memorandum-circular-694",
                    "memorandum-circular-783",
                    "memorandum-circular-885",
                    "memorandum-circular-951",








                    "memorandum-circular-98"
                ]);

                if (
                    selectedType === "Memorandum Circular" &&
                    mcLawphilArtifacts.has(String(law.id || ""))
                ) {
                    return;
                }

                /*
                 * Display-only cleanup for verified Memorandum Circulars.
                 * Database remains unchanged.
                 */
                if (selectedType === "Memorandum Circular") {

                    const mcDisplay = {
                        "memorandum-circular-3s": {
                            number: "38",
                            title: "MEMORANDUM CIRCULAR NO. 38"
                        },
            "memorandum-circular-l-5-8": {
                number: "158",
                title: "AUTHORIZING PARTICIPATION OF GOVERNMENT OFFICIALS/EMPLOYEES IN WORLD INTELLECTUAL PROPERTY ORGANIZATION (WIPO) WORLD SYMPOSIUM ON BROADCASTING, NEW COMMUNICATION TECHNOLOGIES AND INTELLECTUAL PROPERTY"
            },
            "memorandum-circular-67": {
                number: "67",
                title: "REQUIRING ALL CONCERNED TO OBSERVE STRICTLY POLICY PRONOUNCEMENTS AND GUIDELINES ON FOREIGN TRAVEL"
            },
                        "memorandum-circular-00": {
                            number: "112",
                            title: "HOUSING FAIR FOR EMPLOYEES IN THE PUBLIC SECTOR"
                        },
                        "memorandum-circular-20-ocr": {
                            number: "20",
                            title: "AUTHORIZING THE HOLDING OF A SEMINAR ON THE REVISED CIVIL SERVICE RULES FOR ALL PERSONNEL OFFICERS AND TRAINING OFFICERS OF BUREAUS AND OFFICES UNDER THE OFFICE OF THE PRESIDENT."
                        },
                        "memorandum-circular-21-ocr": {
                            number: "57",
                            title: "PRESCRIBING THE GUIDELINES FOR THE IMPLEMENTATION OF MEMORANDUM ORDER NO. 108, DATED 24 MARCH 1993"
                        },
                        "memorandum-circular-4-ocr": {
                            number: "4",
                            title: "CREATING AN EXECUTIVE COMMITTEE TO TAKE CHARGE OF THE PREPARATION AND ARRANGEMENT FOR THE HOLDING OF THE 19TH ANNUAL MEETING OF THE BOARD OF GOVERNORS, ASIAN DEVELOPMENT BANK, TO BE HELD IN MANILA FROM APRIL 30 TO MAY 2, 1986."
                        },
                        "memorandum-circular-ebba248d6bd160a9430b": {
                            number: "14",
                            title: "SUSPENDING REGULAR WORKING HOURS, INCLUDING REGULAR CLASSES, BOTH PUBLIC AND PRIVATE, ON JULY 10, 1986."
                        },
                        "memorandum-circular-12-0": {
                            number: "130",
                            title: "REQUIRING ALL GOVERNMENT AGENCIES TO FURNISH THE UNITED STATES LIBRARY OF CONGRESS THEIR OFFICIAL PUBLICATIONS IN ACCORDANCE WITH THE RP-US AGREEMENT ON THE EXCHANGE OF OFFICIAL PUBLICATIONS."
                        },
                        "memorandum-circular-directing": {
                            number: "22",
                            title: "DIRECTING ALL DEPARTMENT SECRETARIES AND HEADS OF AGENCIES OF THE NATIONAL GOVERNMENT INCLUDING GOVERNMENT-OWNED OR CONTROLLED CORPORATIONS TO MONITOR STRICT COMPLIANCE WITH ADMINISTRATIVE ORDER NO. 204, DATED DECEMBER 17, 1990."
                        },
                        "memorandum-circular-doc-dccc0df905464fc782a75e7d": {
                            number: "1",
                            title: "IMPLEMENTATION OF THE METRIC OR A4 SIZE OF WRITING PAPER"
                        },
                        "memorandum-circular-s": {
                            number: "175",
                            title: "PRESCRIBING THE POLICY REGARDING THE ASSUMPTION OF DUTIES BY AND THE GRANT OF COMPENSATION TO THE MEMBERS OF THE BOARDS OF DIRECTORS (WHO ARE NOMINATED BY THE PRESIDENTIAL COMMISSION ON GOOD GOVERNMENT [PCGG]) OF SEQUESTERED AND SURRENDERED CORPORATIONS UNDER PCGG SUPERVISION"
                        },
                        "memorandum-circular-authorizing": {
                            number: "86",
                            title: "AUTHORIZING ATTENDANCE IN THE INTERNATIONAL SEMINAR ON URBAN CRIMES"
                        },
                        "memorandum-circular-clarifying": {
                            number: "56",
                            title: "CLARIFYING SECTION 3 OF ADMINISTRATIVE ORDER NO. 40, AS AMENDED BY ADMINISTRATIVE ORDER NO. 55, S. 1993"
                        },
                        "memorandum-circular-requiring": {
                            number: "67",
                            title: "REQUIRING ALL CONCERNED TO OBSERVE STRICTLY POLICY PRONOUNCEMENTS AND GUIDELINES ON FOREIGN TRAVEL"
                        },
                        "memorandum-circular-66": {
                            number: "66",
                            title: "REQUIRING ALL CONCERNED TO IMMEDIATELY REPORT TO THIS OFFICE PERSONS CLAIMING TO BE LIAISON OFFICERS OF THE EXECUTIVE OFFICE."
                        },
                        "memorandum-circular-80": {
                            number: "80",
                            title: "ENJOINING ALL HEADS OF DEPARTMENT, BUREAUS, OFFICES AND AGENCIES OF THE NATIONAL AND LOCAL GOVERNMENTS, INCLUDING GOVERNMENT-OWNED AND CONTROLLED CORPORATIONS, TO CONDUCT SEMINARS ON THE PRESIDENT'S FOUR-YEAR ECONOMIC PROGRAM."
                        },
                        "memorandum-circular-80-6": {
                            number: "80-6",
                            title: "EXTENT OF AUTHORITY OF OFFICERS-IN-CHARGE OF PROVINCES, CITIES AND MUNICIPALITIES AND FOR OTHER PURPOSES"
                        },
                        "memorandum-circular-08": {
                            number: "08",
                            title: "CREATING AN INTER-AGENCY TASK FORCE TO EXPEDITE THE ORGANIZATION OF THE DEPARTMENT OF INFORMATION AND COMMUNICATIONS TECHNOLOGY"
                        },
                        "memorandum-circular-1027": {
                            number: "1027",
                            title: "AUTHORIZING THE PAYMENT OF REPRESENTATION ALLOWANCES OF PERSONNEL INVOLVED IN THE PERFORMANCE EVALUATION OF GOVERNMENT EMPLOYEES AT THE REGIONAL LEVEL."
                        },
                        "memorandum-circular-11": {
                            number: "11",
                            title: "REQUIRING PROMPT ACTION ON OFFICIAL PAPERS BY ALL AGENCIES OF THE GOVERNMENT."
                        },
                        "memorandum-circular-1108": {
                            number: "1108",
                            title: "DESIGNATING THE PHILIPPINE COUNCIL FOR PLANNING AND HOUSING AS THE OFFICIAL PROFESSIONAL FORUM FOR THE REVIEW AND DISCUSSION OF PROPOSED GOVERNMENT POLICIES AND MAJOR PROGRAMS IN THE FIELDS OF PLANNING AND HOUSING."
                        },
                        "memorandum-circular-1178": {
                            number: "1178",
                            title: "REQUIRING GOVERNMENT OFFICIALS AND EMPLOYEES IN THE METRO-MANILA-AREA TO ATTEND THE CEREMONIES AT THE LUNETA ON THE OCCASION OF THE 83RD DEATH ANNIVERSARY OF OUR NATIONAL HERO, DR. JOSE P. RIZAL, ON DECEMBER 30, 1979."
                        },
                        "memorandum-circular-368": {
                            number: "368",
                            title: "NAG-AATAS NA MAGDAOS NG PALATUNTUNAN SA PAGDIRIWANG NG LINGGO NG WIKANG PAMBANSA."
                        },
                        "memorandum-circular-384": {
                            number: "384",
                            title: "PAGTATALAGA NG KAWANING MANGANGASIWA SA LAHAT NG KOMUNIKASYON SA WIKANG PILIPINO SA LAHAT NG KAGAWARAN, KAWANIHAN, TANGGAPAN AT IBANG PANG SANGAY NG PAMAHALAAN AT KORPORASYONG ARI O PINANGANGASIWAAN NG PAMAHALAAN"
                        },
                        "memorandum-circular-443": {
                            number: "443",
                            title: "NAG-AATAS NA MAGDAOS NG PALATUNTUNAN ANG MGA TANGGAPANG PAMPAMAHALAAN BILANG PAGGUNITA SA IKA-183 KAARAWAN NI FRANCISCO (BALAGTAS) BALTAZAR, SA ABRIL 2, 1971"
                        },
                        "memorandum-circular-488": {
                            number: "488",
                            title: "NAG-AATAS SA LAHAT NG TANGGAPANG PAMPAHALAAN NA MAGDAOS NG PALATUNTUNAN SA PAGDIRIWANG NG LINGGO NG WIKANG PAMBANSA"
                        },
                        "memorandum-circular-77": {
                            number: "77",
                            title: "PROVIDING FOR THE ADOPTION OF THE HALF-DAY SESSION PURSUANT TO EXECUTIVE ORDER NO. 77 DATED MARCH 30, 1964"
                        },
                        "memorandum-circular-ctober": {
                            number: "1077",
                            title: "AMENDING MEMORANDUM CIRCULAR NO. 1076 ENTITLED AUTHORIZING ATTENDANCE OF GOVERNMENT PERSONNEL IN THE 4TH NATIONAL CULTURAL CONFERENCE-WORKSHOP SPONSORED BY THE PHILIPPINE GOVERNMENT CULTURAL ASSOCIATION."
                        },
                        "memorandum-circular-malaca": {
                            number: "1082",
                            title: "CONSIDERING THE POLL SERVICE PREVIOUSLY RENDERED BY TEACHERS AND OTHER PUBLIC SCHOOL PERSONNEL AS EQUIVALENT TO RURAL SERVICE."
                        },
                        "memorandum-circular-strengtheningthe": {
                            number: "71",
                            title: "STRENGTHENING THE RESOLVE TO ERADICATE ILLITERACY BY THE YEAR 2000"
                        },
                        "memorandum-circular-encouraging": {
                            number: "48",
                            title: "ENCOURAGING ALL INFORMATION TECHNOLOGY (IT) EXECUTIVES, SPECIALISTS, PRACTITIONERS, USERS, INSTRUCTORS, AND ALLIED PROFESSIONS IN GOVERNMENT SERVICE TO ATTEND THE GOVERNMENT ORGANIZATION FOR IT (GO-IT) ANNUAL CONVENTION"
                        }
                    };

                    const fixed = mcDisplay[law.id];

                    if (fixed) {
                        displayNumber =
                            "MEMORANDUM CIRCULAR NO. " +
                            fixed.number;

                        description = fixed.title;
                    }
                }

                const count =
                    selectedType === "Jurisprudence" &&
                    Number(law.articleCount || 0) === 0 &&
                    String(law.text || "").trim()
                        ? 1
                        : Number(law.articleCount || 0);

                button.innerHTML =
                    '<div class="law-number">' +
                    escapeHtml(displayNumber) +
                    "</div>" +
                    '<div class="law-title">' +
                    escapeHtml(description) +
                    "</div>" +
                    '<div class="law-count">' +
                    count +
                    (count === 1
                        ? " provision"
                        : " provisions") +
                    "</div>";

                button.addEventListener(
                    "click",
                    function () {

                        lawList.innerHTML =
                            '<div style="padding:20px;">' +
                            "Loading law...</div>";

                        window.philippineLawsAPI
                            .getLawById(law.id)
                            .then(function (fullLaw) {

                                if (!fullLaw) {
                                    throw new Error(
                                        "Law record not found."
                                    );
                                }

                                selectLaw(fullLaw);
                            })
                            .catch(function (error) {

                                console.error(
                                    "FAILED TO LOAD LAW:",
                                    error
                                );

                                lawList.innerHTML =
                                    '<div style="padding:20px;color:#b00020;">' +
                                    "<strong>Unable to load law.</strong><br><br>" +
                                    escapeHtml(
                                        error.message ||
                                        String(error)
                                    ) +
                                    "</div>";
                            });
                    }
                );

                /*
                 * Display-only BULK recovery for Jurisprudence records
                 * whose existing display title is not a usable public
                 * case caption/identifier.
                 *
                 * Database remains unchanged.
                 *
                 * law.number is INTERNAL and is never used as the
                 * public jurisprudence case identifier.
                 */
                if (selectedType === "Jurisprudence") {

                    const jpExistingNumber =
                        String(displayNumber || "")
                            .replace(/\s+/g, " ")
                            .trim();

                    const jpExistingTitle =
                        String(description || "")
                            .replace(/\s+/g, " ")
                            .trim();

                    const jpCombined =
                        (jpExistingNumber + " " + jpExistingTitle)
                            .toUpperCase();

                    const jpHasPublicIdentifier =
                        /\b(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:NO\.?|NOS\.?)\b/i
                            .test(jpCombined);

                    const jpGenericHeader =
                        /^REPUBLIC OF THE PHILIPPINES\s+SUPREME COURT(?:\s+(?:BAGUIO CITY|MANILA))?$/i
                            .test(jpExistingTitle);

                    /*
                     * These are identifiers/header fragments rather than
                     * actual case captions. They may contain a valid docket
                     * number, so jpHasPublicIdentifier alone is not enough
                     * to decide that the card is already correct.
                     */
                    const jpGenericCaption =
                        /^(?:REPUBLIC OF THE PHILIPPINES(?:,)?\s*(?:G\.\s*R\.?|A\.\s*C\.?|A\.\s*M\.?|B\.\s*M\.?|B\.\s*R\.?)|DECISION(?:\s+\d+)?(?:\s+AND\s+RESOLUTION)?|DECISION\s+AND\s+RESOLUTION|DECISION\s+\d+\s+OF\s+THE\s+COURT\s+OF\s+APPEALS|DECISION\s+1\s+OF\s+THE\s+COURT\s+OF\s+APPEALS|DECISION\s+2\s+OF\s+THE\s+COURT\s+OF\s+APPEALS|WHEREFORE\b|WHILE\s+THE\s+PLEADINGS\b)/i
                            .test(jpExistingTitle);

                    const jpIdentifierOnly =
                        /^(?:G\.\s*R\.?|A\.\s*C\.?|A\.\s*M\.?|B\.\s*M\.?|B\.\s*R\.?)\s*(?:NO\.?|NOS\.?)?\s*[A-Za-z0-9][A-Za-z0-9 .~\/&()\-–—]*$/i
                            .test(jpExistingTitle);

                    /*
                     * Recover whenever the current title is merely a court
                     * header, an identifier, or a generic decision/body
                     * fragment. Already-good party captions remain untouched.
                     */
                    const jpNeedsRecovery =
                        jpGenericHeader ||
                        jpGenericCaption ||
                        jpIdentifierOnly ||
                        !jpHasPublicIdentifier;

                    if (jpNeedsRecovery) {

                        window.philippineLawsAPI
                            .getLawById(law.id)
                            .then(function (fullLaw) {

                                if (!fullLaw) {
                                    return;
                                }

                                const source =
                                    String(fullLaw.text || "")
                                        .replace(/\r/g, "");

                                const lines =
                                    source
                                        .split("\n")
                                        .map(function (line) {
                                            return line
                                                .replace(/&nbsp;/gi, " ")
                                                .replace(/\s+/g, " ")
                                                .trim();
                                        })
                                        .filter(function (line) {
                                            return line.length > 0;
                                        });

                                let caseNumber = "";
                                let caseTitle = "";

                                /*
                                 * Recover the actual public docket number.
                                 *
                                 * Prefer the identifier appearing near the
                                 * beginning of the document. This prevents a
                                 * later unrelated G.R. number from replacing
                                 * the actual identifier of the record.
                                 *
                                 * Includes "ADM. MATTER NO." because older
                                 * administrative jurisprudence uses that
                                 * form instead of "A.M. No.".
                                 */
                                const jpIdentifierPattern =
                                    /\b((?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:No\.?|Nos\.?)\s*[A-Za-z0-9][A-Za-z0-9 .~\/&()\-–—]*|ADM\.?\s+MATTER\s+NO\.?\s*[A-Za-z0-9][A-Za-z0-9 .~\/&()\-–—]*)/i;

                                const jpEarlyLines =
                                    lines.slice(0, Math.min(lines.length, 20));

                                for (const line of jpEarlyLines) {

                                    const numberMatch =
                                        line.match(jpIdentifierPattern);

                                    if (numberMatch) {
                                        caseNumber =
                                            numberMatch[1]
                                                .replace(/~/g, "")
                                                .replace(/\s+/g, " ")
                                                .replace(/[.,;:]+$/, "")
                                                .trim();
                                        break;
                                    }
                                }

                                /*
                                 * Only fall back to the full document when
                                 * no identifier was found near the beginning.
                                 */
                                if (!caseNumber) {

                                    for (const line of lines) {

                                        const numberMatch =
                                            line.match(jpIdentifierPattern);

                                        if (numberMatch) {
                                            caseNumber =
                                                numberMatch[1]
                                                    .replace(/~/g, "")
                                                    .replace(/\s+/g, " ")
                                                    .replace(/[.,;:]+$/, "")
                                                    .trim();
                                            break;
                                        }
                                    }
                                }

                                /*
                                 * Recover the case caption from the
                                 * OPENING CASE HEADING ONLY.
                                 *
                                 * Never scan the body of the decision for
                                 * petitioner/respondent/etc. Later matches
                                 * are ordinary prose and can create false
                                 * captions.
                                 *
                                 * This handles:
                                 *
                                 *   PARTY, petitioner,
                                 *   vs.
                                 *   PARTY, respondent.
                                 *
                                 * and OCR two-column headings where the
                                 * "Present:" judge column is interleaved
                                 * with the case caption.
                                 */
                                const rolePattern =
                                    /\b(?:the\s+)?(?:complainant|complainants|petitioner|petitioners|respondent|respondents|plaintiff|plaintiffs|defendant|defendants|appellant|appellants|accused)\b/i;

                                const jpOpeningLines =
                                    lines.slice(0, Math.min(lines.length, 40));

                                function jpCleanCaptionPart(value) {

                                    return String(value || "")
                                        .replace(/&amp;/gi, "&")
                                        .replace(/&nbsp;/gi, " ")
                                        .replace(/\s+/g, " ")
                                        .replace(/[,:;.\s]+$/, "")
                                        .trim();
                                }

                                /*
                                 * Remove a docket number from the end of a
                                 * party line. This is needed for layouts such
                                 * as:
                                 *
                                 *   AIR CANADA, GR. No. 169507
                                 */
                                function jpStripTrailingDocket(value) {

                                    return String(value || "")
                                        .replace(
                                            /\s*,?\s*(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:No\.?|Nos\.?)?\s*[A-Za-z0-9][A-Za-z0-9 .~\/&()\-–—]*$/i,
                                            ""
                                        )
                                        .replace(
                                            /\s*,?\s*ADM\.?\s+MATTER\s+NO\.?\s*[A-Za-z0-9][A-Za-z0-9 .~\/&()\-–—]*$/i,
                                            ""
                                        );
                                }

                                /*
                                 * Identify whether a line is only court
                                 * metadata and therefore cannot be a caption.
                                 */
                                function jpIsHeaderLine(value) {

                                    const line =
                                        String(value || "").trim();

                                    return (
                                        !line ||
                                        /^REPUBLIC OF THE PHILIPPINES(?:,)?$/i.test(line) ||
                                        /^SUPREME COURT(?:\s+.*)?$/i.test(line) ||
                                        /^(?:MANILA|BAGUIO CITY)$/i.test(line) ||
                                        /^(?:EN BANC|FIRST DIVISION|SECOND DIVISION|THIRD DIVISION|FOURTH DIVISION|DIVISION)$/i.test(line) ||
                                        /^D\s*E\s*C\s*I\s*S\s*I\s*O\s*N$/i.test(line) ||
                                        /^PROMULGATED:?$/i.test(line) ||
                                        /^PRESENT:?$/i.test(line) ||
                                        /^-+\s*$/i.test(line) ||
                                        /^x-+$/i.test(line)
                                    );
                                }

                                /*
                                 * CASE TYPE 1:
                                 *
                                 * "IN RE:" captions are often multiline.
                                 *
                                 * Example:
                                 *
                                 * IN RE: PETITION FOR G.R. No. 180802
                                 * CANCELLATION AND
                                 * CORRECTION OF ENTRIES IN
                                 * THE RECORDS OF BIRTH, Present:
                                 */
                                let inReParts = [];
                                let inReStarted = false;

                                for (const line of jpOpeningLines) {

                                    if (/\bPresent:\s*/i.test(line)) {
                                        const beforePresent =
                                            line
                                                .split(/\bPresent:\s*/i)[0]
                                                .trim();

                                        if (
                                            beforePresent &&
                                            inReStarted
                                        ) {
                                            const cleaned =
                                                jpCleanCaptionPart(
                                                    jpStripTrailingDocket(
                                                        beforePresent
                                                    )
                                                );

                                            if (cleaned) {
                                                inReParts.push(cleaned);
                                            }
                                        }

                                        break;
                                    }

                                    if (/^IN\s+RE:/i.test(line)) {
                                        inReStarted = true;

                                        const cleaned =
                                            jpCleanCaptionPart(
                                                jpStripTrailingDocket(line)
                                            );

                                        if (cleaned) {
                                            inReParts.push(cleaned);
                                        }

                                        continue;
                                    }

                                    if (inReStarted) {

                                        if (
                                            /^-?\s*(?:vs\.?|versus)\s*-?$/i.test(line) ||
                                            rolePattern.test(line)
                                        ) {
                                            break;
                                        }

                                        if (!jpIsHeaderLine(line)) {

                                            const cleaned =
                                                jpCleanCaptionPart(
                                                    jpStripTrailingDocket(line)
                                                );

                                            if (cleaned) {
                                                inReParts.push(cleaned);
                                            }
                                        }
                                    }
                                }

                                if (inReParts.length > 0) {

                                    caseTitle =
                                        jpCleanCaptionPart(
                                            inReParts.join(" ")
                                        );
                                }

                                /*
                                 * CASE TYPE 2:
                                 *
                                 * Ordinary party caption.
                                 *
                                 * The caption begins after the first docket
                                 * heading and ends at the first party-role
                                 * marker. Court metadata, dates, docket-only
                                 * lines, and OCR judge-column material are
                                 * never treated as caption text.
                                 */
                                if (!caseTitle) {

                                    const jpDocketPattern =
                                        /\b(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:No\.?|Nos\.?)?\s*[A-Za-z0-9]/i;

                                    const jpAdmMatterPattern =
                                        /\bADM\.?\s+MATTER\s+NO\.?\s*[A-Za-z0-9]/i;

                                    function jpHasDocket(value) {
                                        const text = String(value || "");

                                        return (
                                            jpDocketPattern.test(text) ||
                                            jpAdmMatterPattern.test(text)
                                        );
                                    }

                                    function jpRemoveHeadingMetadata(value) {

                                        let result =
                                            String(value || "")
                                                .replace(/&amp;/gi, "&")
                                                .replace(/&nbsp;/gi, " ")
                                                .replace(/\s+/g, " ")
                                                .trim();

                                        /*
                                         * Remove a complete docket + date line.
                                         *
                                         * Examples:
                                         *
                                         * G.R. 114942 November 27, 2000
                                         * G.R. 153526 October 25, 2005
                                         * G.R No. 168999 April 30, 2008
                                         */
                                        result =
                                            result.replace(
                                                /^(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:No\.?|Nos\.?)?\s*[A-Za-z0-9][A-Za-z0-9\-–—]*\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s*$/i,
                                                ""
                                            );

                                        /*
                                         * Remove a complete administrative
                                         * matter docket line.
                                         */
                                        result =
                                            result.replace(
                                                /^ADM\.?\s+MATTER\s+NO\.?\s*[A-Za-z0-9][A-Za-z0-9\-–—]*\s*$/i,
                                                ""
                                            );

                                        /*
                                         * Remove a complete G.R./A.C./A.M./
                                         * B.M./B.R. docket-only line.
                                         */
                                        result =
                                            result.replace(
                                                /^(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:No\.?|Nos\.?)?\s*[A-Za-z0-9][A-Za-z0-9\-–—]*\s*$/i,
                                                ""
                                            );

                                        /*
                                         * Remove docket/date metadata from
                                         * the end of a party line.
                                         *
                                         * Example:
                                         *
                                         * AIR CANADA, GR. No. 169507
                                         */
                                        result =
                                            result.replace(
                                                /\s*,?\s*(?:G\.?\s*R\.?|A\.?\s*C\.?|A\.?\s*M\.?|B\.?\s*M\.?|B\.?\s*R\.)\s*(?:No\.?|Nos\.?)?\s*[A-Za-z0-9][A-Za-z0-9\-–—]*\s*$/i,
                                                ""
                                            );

                                        result =
                                            result.replace(
                                                /\s*,?\s*ADM\.?\s+MATTER\s+NO\.?\s*[A-Za-z0-9][A-Za-z0-9\-–—]*\s*$/i,
                                                ""
                                            );

                                        return result.trim();
                                    }

                                    function jpRemoveJudgeTail(value) {

                                        return String(value || "")
                                            /*
                                             * Examples:
                                             *
                                             * Superintendent, SERENO, CJ.,
                                             * BERSAMIN, J.,
                                             * LEONARDO-DE CASTRO, J.,
                                             */
                                            .replace(
                                                /\s*,\s*[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*)*\s*,\s*(?:CJ|J)\.?\s*,?\s*$/i,
                                                ""
                                            )
                                            .trim();
                                    }

                                    function jpIsPureHeadingMetadata(value) {

                                        const line =
                                            String(value || "").trim();

                                        return (
                                            /^REPUBLIC OF THE PHILIPPINES(?:,)?$/i.test(line) ||
                                            /^SUPREME COURT(?:\s+.*)?$/i.test(line) ||
                                            /^(?:MANILA|BAGUIO CITY)$/i.test(line) ||
                                            /^(?:EN BANC|FIRST DIVISION|SECOND DIVISION|THIRD DIVISION|FOURTH DIVISION|DIVISION)$/i.test(line) ||
                                            /^PROMULGATED:?$/i.test(line) ||
                                            /^PRESENT:?$/i.test(line) ||
                                            /^-+\s*$/i.test(line) ||
                                            /^x-+\s*$/i.test(line)
                                        );
                                    }

                                    /*
                                     * Find the first docket-bearing line.
                                     * This prevents court headers appearing
                                     * before the docket from becoming part of
                                     * the caption.
                                     */
                                    let docketIndex = -1;

                                    for (
                                        let i = 0;
                                        i < jpOpeningLines.length;
                                        i++
                                    ) {
                                        if (
                                            jpHasDocket(
                                                jpOpeningLines[i]
                                            )
                                        ) {
                                            docketIndex = i;
                                            break;
                                        }
                                    }

                                    if (docketIndex >= 0) {

                                        const candidateParts = [];
                                        let presentColumnStarted = false;
                                        let partyRoleCount = 0;

                                        for (
                                            let i = docketIndex;
                                            i < jpOpeningLines.length;
                                            i++
                                        ) {

                                            let usableLine =
                                                jpOpeningLines[i];

                                            /*
                                             * Stop before the decision body.
                                             */
                                            if (
                                                /^D\s*E\s*C\s*I\s*C\s*I\s*O\s*N$/i.test(
                                                    usableLine
                                                ) ||
                                                /^DECISION\b/i.test(
                                                    usableLine
                                                ) ||
                                                /^RESOLUTION\b/i.test(
                                                    usableLine
                                                ) ||
                                                /^ORDER\b/i.test(
                                                    usableLine
                                                )
                                            ) {
                                                break;
                                            }

                                            /*
                                             * A standalone Present: starts the
                                             * OCR judge column.
                                             */
                                            if (
                                                /^PRESENT:?$/i.test(
                                                    usableLine
                                                )
                                            ) {
                                                presentColumnStarted = true;
                                                continue;
                                            }

                                            /*
                                             * If Present: is embedded in a
                                             * two-column line, retain only the
                                             * case-side text.
                                             */
                                            const presentIndex =
                                                usableLine.search(
                                                    /\bPresent:\s*/i
                                                );

                                            if (presentIndex >= 0) {

                                                usableLine =
                                                    usableLine
                                                        .slice(
                                                            0,
                                                            presentIndex
                                                        )
                                                        .trim();

                                                presentColumnStarted = true;
                                            }

                                            if (!usableLine) {
                                                continue;
                                            }

                                            /*
                                             * Remove docket/date material
                                             * before testing the line.
                                             */
                                            let cleaned =
                                                jpRemoveHeadingMetadata(
                                                    usableLine
                                                );

                                            /*
                                             * Remove a judge suffix that can
                                             * be attached to the end of an OCR
                                             * party line.
                                             */
                                            cleaned =
                                                jpRemoveJudgeTail(cleaned);

                                            cleaned =
                                                jpCleanCaptionPart(cleaned);

                                            if (!cleaned) {
                                                continue;
                                            }

                                            /*
                                             * Pure dates are metadata.
                                             */
                                            if (
                                                /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i.test(
                                                    cleaned
                                                )
                                            ) {
                                                continue;
                                            }

                                            /*
                                             * Pure court/header lines are not
                                             * caption material.
                                             */
                                            if (
                                                jpIsPureHeadingMetadata(
                                                    cleaned
                                                )
                                            ) {
                                                continue;
                                            }

                                            /*
                                             * Versus is only a separator.
                                             */
                                            if (
                                                /^-?\s*(?:vs\.?|versus)\s*-?$/i.test(
                                                    cleaned
                                                )
                                            ) {
                                                continue;
                                            }

                                            /*
                                             * Party-caption line.
                                             *
                                             * Do NOT stop at the first party
                                             * role.  A normal caption can have
                                             * both sides on separate lines:
                                             *
                                             * THE PEOPLE OF THE PHILIPPINES,
                                             * plaintiff-appellee,
                                             *
                                             * vs.
                                             *
                                             * ESTEBAN R. CHAVES,
                                             * defendant-appellant.
                                             *
                                             * Collect the party text from each
                                             * side, while removing the role
                                             * labels themselves.
                                             */
                                            const roleMatch =
                                                cleaned.match(
                                                    rolePattern
                                                );

                                            if (roleMatch) {

                                                partyRoleCount++;

                                                let beforeRole =
                                                    cleaned
                                                        .slice(
                                                            0,
                                                            roleMatch.index
                                                        )
                                                        .trim();

                                                beforeRole =
                                                    jpCleanCaptionPart(
                                                        beforeRole
                                                    );

                                                if (beforeRole) {
                                                    candidateParts.push(
                                                        beforeRole
                                                    );
                                                }

                                                /*
                                                 * Do not keep the role label
                                                 * or its remaining suffix
                                                 * (for example "-appellee").
                                                 * The role belongs to the
                                                 * metadata, not the public case
                                                 * caption.
                                                 */
                                                let afterRole =
                                                    cleaned
                                                        .slice(
                                                            roleMatch.index +
                                                            roleMatch[0].length
                                                        )
                                                        .trim();

                                                afterRole =
                                                    afterRole
                                                        .replace(
                                                            /^[-,:;\s]+/,
                                                            ""
                                                        )
                                                        .replace(
                                                            /^(?:appellee|appellant|respondent|petitioner|complainant|plaintiff|defendant|accused)\b.*$/i,
                                                            ""
                                                        )
                                                        .trim();

                                                if (afterRole) {
                                                    candidateParts.push(
                                                        afterRole
                                                    );
                                                }

                                                /*
                                                 * Add the public "vs." separator
                                                 * before the second party.
                                                 */
                                                if (partyRoleCount === 2) {
                                                    const firstParty =
                                                        candidateParts
                                                            .slice(
                                                                0,
                                                                Math.max(
                                                                    1,
                                                                    candidateParts.length -
                                                                    1
                                                                )
                                                            )
                                                            .join(" ");

                                                    const secondParty =
                                                        candidateParts[
                                                            candidateParts.length -
                                                            1
                                                        ];

                                                    candidateParts.length = 0;

                                                    candidateParts.push(
                                                        firstParty,
                                                        "vs.",
                                                        secondParty
                                                    );
                                                }

                                                /*
                                                 * A normal two-sided caption
                                                 * has two party roles. Once the
                                                 * second role is reached, the
                                                 * caption is complete.
                                                 */
                                                if (partyRoleCount >= 2) {
                                                    caseTitle =
                                                        jpCleanCaptionPart(
                                                            candidateParts
                                                                .filter(Boolean)
                                                                .join(" ")
                                                        );
                                                    break;
                                                }

                                                /*
                                                 * First party only so far.
                                                 * Continue collecting the
                                                 * opposite side of the case.
                                                 */
                                                continue;
                                            }

                                            /*
                                             * A standalone "vs." line is only
                                             * a separator.  If the opposite
                                             * party follows on the next line,
                                             * continue collecting it.
                                             */

                                            if (
                                                candidateParts.length > 0 &&
                                                candidateParts.length < 12
                                            ) {
                                                candidateParts.push(cleaned);
                                                continue;
                                            }

                                            /*
                                             * Once the OCR judge column has
                                             * started, reject standalone judge
                                             * names such as:
                                             *
                                             * SERENO, CJ.
                                             * BERSAMIN, J.
                                             */
                                            if (
                                                presentColumnStarted &&
                                                /^(?:[A-Z][A-Z.'-]*(?:\s+[A-Z][A-Z.'-]*)*,\s*)?(?:CJ\.|J\.)?,?$/i.test(
                                                    cleaned
                                                )
                                            ) {
                                                continue;
                                            }

                                            /*
                                             * Accumulate only plausible
                                             * caption fragments. A maximum
                                             * keeps malformed OCR headings from
                                             * running into unrelated material.
                                             */
                                            if (cleaned.length >= 3) {
                                                candidateParts.push(cleaned);
                                            }

                                            if (
                                                candidateParts.length >= 12
                                            ) {
                                                break;
                                            }
                                        }

                                        if (!caseTitle) {

                                            const combined =
                                                candidateParts
                                                    .filter(Boolean)
                                                    .join(" ");

                                            if (combined.length >= 3) {
                                                caseTitle =
                                                    jpCleanCaptionPart(
                                                        combined
                                                    );
                                            }
                                        }
                                    }
                                }

                                /*
                                 * BULK FALLBACK FOR IDENTIFIER-ONLY
                                 * JURISPRUDENCE TITLES.
                                 *
                                 * Some LawPhil/OCR records store the entire
                                 * opening case heading on one line:
                                 *
                                 * G.R. No. L-37736 February 23, 1988
                                 * ANTONIO EVANGELISTA Y LISING, petitioner,
                                 * vs. THE COURT OF APPEALS, respondent.
                                 *
                                 * The existing line-based extractor above is
                                 * intentionally preserved. This fallback is
                                 * used only when the original public title
                                 * needs recovery and the existing extractor
                                 * did not produce a usable party caption.
                                 *
                                 * DISPLAY ONLY. Database unchanged.
                                 */
                                if (
                                    !caseTitle &&
                                    (
                                        jpIdentifierOnly ||
                                        jpGenericHeader ||
                                        jpGenericCaption
                                    )
                                ) {

                                    const fallbackSource =
                                        String(source || "")
                                            .replace(/&amp;/gi, "&")
                                            .replace(/&nbsp;/gi, " ")
                                            .replace(/\\r/g, " ")
                                            .replace(/\\n/g, " ")
                                            .replace(/\\s+/g, " ")
                                            .trim();

                                    /*
                                     * Locate the first party-role marker.
                                     * Everything immediately before it, after
                                     * the docket/date heading, is the first
                                     * party.
                                     */
                                    const firstRole =
                                        fallbackSource.match(
                                            /\\b(?:the\\s+)?(?:complainant|complainants|petitioner|petitioners|respondent|respondents|plaintiff|plaintiffs|defendant|defendants|appellant|appellants|accused)\\b/i
                                        );

                                    if (firstRole) {

                                        let firstParty =
                                            fallbackSource.slice(
                                                0,
                                                firstRole.index
                                            );

                                        /*
                                         * Remove court/docket/date material
                                         * from the beginning of the party.
                                         */
                                        firstParty =
                                            firstParty
                                                .replace(
                                                    /^.*?(?:G\\.?\\s*R\\.?|A\\.?\\s*C\\.?|A\\.?\\s*M\\.?|B\\.?\\s*M\\.?|B\\.?\\s*R\\.)\\s*(?:No\\.?|Nos\\.?)?\\s*[A-Za-z0-9][A-Za-z0-9 .~\\/\\&()\\-–—]*?(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},\\s+\\d{4}\\s*/i,
                                                    ""
                                                )
                                                .trim();

                                        /*
                                         * If the date-bearing prefix was not
                                         * removed, try a simpler docket/date
                                         * prefix removal.
                                         */
                                        firstParty =
                                            firstParty
                                                .replace(
                                                    /^.*?(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{1,2},\\s+\\d{4}\\s+/i,
                                                    ""
                                                )
                                                .trim();

                                        firstParty =
                                            jpCleanCaptionPart(
                                                jpStripTrailingDocket(
                                                    firstParty
                                                )
                                            );

                                        /*
                                         * Find the "vs." separator after the
                                         * first party, then the second party's
                                         * role.
                                         */
                                        const afterFirstRole =
                                            fallbackSource.slice(
                                                firstRole.index +
                                                firstRole[0].length
                                            );

                                        const versusMatch =
                                            afterFirstRole.match(
                                                /\\b(?:vs\\.?|versus)\\b/i
                                            );

                                        if (
                                            firstParty &&
                                            versusMatch
                                        ) {

                                            const secondStart =
                                                versusMatch.index +
                                                versusMatch[0].length;

                                            const secondArea =
                                                afterFirstRole.slice(
                                                    secondStart
                                                );

                                            const secondRole =
                                                secondArea.match(
                                                    /\\b(?:the\\s+)?(?:respondent|respondents|defendant|defendants|appellant|appellants|accused|complainant|complainants|petitioner|petitioners|plaintiff|plaintiffs)\\b/i
                                                );

                                            if (secondRole) {

                                                let secondParty =
                                                    secondArea.slice(
                                                        0,
                                                        secondRole.index
                                                    );

                                                secondParty =
                                                    jpCleanCaptionPart(
                                                        jpStripTrailingDocket(
                                                            secondParty
                                                        )
                                                    );

                                                if (
                                                    secondParty &&
                                                    firstParty.length >= 3 &&
                                                    secondParty.length >= 3
                                                ) {
                                                    caseTitle =
                                                        firstParty +
                                                        " vs. " +
                                                        secondParty;
                                                }
                                            }
                                        }
                                    }
                                }

                                /*
                                 * FINAL BULK CAPTION RECOVERY
                                 *
                                 * If the preceding extractors still failed,
                                 * recover the caption directly from the
                                 * beginning of the source document.
                                 *
                                 * This is DISPLAY ONLY.
                                 * Database is never modified.
                                 */
                                const jpCaseTitleIsIdentifier =
                                    /^(?:G\.\s*R\.?|A\.\s*C\.?|A\.\s*M\.?|B\.\s*M\.?|B\.\s*R\.?)\s*(?:No\.?|Nos\.?)\s+.+$/i
                                        .test(String(caseTitle || "").trim());

                                if (
                                    (
                                        !caseTitle ||
                                        jpCaseTitleIsIdentifier
                                    ) &&
                                    (
                                        jpIdentifierOnly ||
                                        jpGenericHeader ||
                                        jpGenericCaption ||
                                        !description ||
                                        String(description || "").trim() ===
                                            String(law.title || "").trim()
                                    )
                                ) {

                                    const normalizedSource =
                                        String(source || "")
                                            .replace(/&amp;/gi, "&")
                                            .replace(/&nbsp;/gi, " ")
                                            .replace(/[\r\n]+/g, " ")
                                            .replace(/\s+/g, " ")
                                            .trim();

                                    /*
                                     * Use only the opening portion.
                                     * This prevents ordinary "petitioner"
                                     * and "respondent" mentions in the body
                                     * from becoming fake captions.
                                     */
                                    const opening =
                                        normalizedSource.slice(0, 6000);

                                    /*
                                     * IN RE cases.
                                     */
                                    const inReMatch =
                                        opening.match(
                                            /\bIN\s+RE:\s*(.+?)(?=\s+(?:DECISION|RESOLUTION|ORDER|PRESENT:|PROMULGATED:)|$)/i
                                        );

                                    if (inReMatch) {

                                        const recoveredInRe =
                                            jpCleanCaptionPart(
                                                inReMatch[1]
                                            );

                                        if (
                                            recoveredInRe.length >= 5 &&
                                            !jpIdentifierOnly.test(
                                                recoveredInRe
                                            )
                                        ) {
                                            caseTitle =
                                                "IN RE: " +
                                                recoveredInRe;
                                        }
                                    }

                                    /*
                                     * Ordinary PARTY vs. PARTY cases.
                                     *
                                     * Match the first actual case separator,
                                     * not later "vs." references in the body.
                                     */
                                    if (!caseTitle) {

                                        const vsMatch =
                                            opening.match(
                                                /\b(?:vs\.?|versus)\b/i
                                            );

                                        if (vsMatch) {

                                            let left =
                                                opening.slice(
                                                    0,
                                                    vsMatch.index
                                                );

                                            let right =
                                                opening.slice(
                                                    vsMatch.index +
                                                    vsMatch[0].length
                                                );

                                            /*
                                             * The left side may contain:
                                             *
                                             * G.R. No. ...
                                             * date
                                             * court headings
                                             *
                                             * Remove everything through the
                                             * first date in the opening.
                                             */
                                            left =
                                                left.replace(
                                                    /^.*?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+/i,
                                                    ""
                                                );

                                            /*
                                             * If no date was available,
                                             * remove the docket/header prefix.
                                             */
                                            if (
                                                /^(?:Republic of the Philippines|Supreme Court|Manila|Baguio City|En Banc|First Division|Second Division|Third Division|Fourth Division|Division|G\.\s*R\.|A\.\s*M\.|A\.\s*C\.|B\.\s*M\.|B\.\s*R\.)/i.test(left.trim())
                                            ) {
                                                left =
                                                    left.replace(
                                                        /^.*?(?:G\.\s*R\.|A\.\s*M\.|A\.\s*C\.|B\.\s*M\.|B\.\s*R\.)\s*(?:No\.?|Nos\.?)?\s*[A-Za-z0-9][A-Za-z0-9 .~\/&()\-–—]*?\s+/i,
                                                        ""
                                                    );
                                            }

                                            /*
                                             * Remove judge-column material
                                             * that sometimes appears between
                                             * the party and the separator.
                                             */
                                            left =
                                                left
                                                    .replace(
                                                        /\s+Present:.*$/i,
                                                        ""
                                                    )
                                                    .trim();

                                            /*
                                             * Stop the right side at the
                                             * respondent/defendant/etc.
                                             * designation.
                                             */
                                            const rightRole =
                                                right.match(
                                                    /\s*,?\s*(?:the\s+)?(?:respondent|respondents|defendant|defendants|appellant|appellants|accused|complainant|complainants|petitioner|petitioners|plaintiff|plaintiffs)\b/i
                                                );

                                            if (rightRole) {
                                                right =
                                                    right.slice(
                                                        0,
                                                        rightRole.index
                                                    );
                                            }

                                            /*
                                             * Remove leading/trailing OCR
                                             * punctuation and metadata.
                                             */
                                            left =
                                                jpCleanCaptionPart(
                                                    jpStripTrailingDocket(left)
                                                );

                                            right =
                                                jpCleanCaptionPart(
                                                    jpStripTrailingDocket(right)
                                                );

                                            /*
                                             * Remove party-role labels from
                                             * the left side if they survived.
                                             */
                                            left =
                                                left.replace(
                                                    /\s*,?\s*(?:the\s+)?(?:petitioner|petitioners|complainant|complainants|plaintiff|plaintiffs|appellant|appellants|accused)\s*$/i,
                                                    ""
                                                ).trim();

                                            right =
                                                right.replace(
                                                    /\s*,?\s*(?:the\s+)?(?:respondent|respondents|defendant|defendants|appellant|appellants|accused|complainant|complainants|petitioner|petitioners|plaintiff|plaintiffs)\s*$/i,
                                                    ""
                                                ).trim();

                                            if (
                                                left.length >= 3 &&
                                                right.length >= 3 &&
                                                !/^G\.\s*R\./i.test(left) &&
                                                !/^A\.\s*[MC]\./i.test(left) &&
                                                !/^B\.\s*[MR]\./i.test(left)
                                            ) {
                                                caseTitle =
                                                    left +
                                                    " vs. " +
                                                    right;
                                            }
                                        }
                                    }
                                }

                                if (caseNumber) {
                                    displayNumber = caseNumber;
                                }

                                if (caseTitle) {
                                    description = caseTitle;
                                }

                                const numberElement =
                                    button.querySelector(".law-number");

                                const titleElement =
                                    button.querySelector(".law-title");

                                if (numberElement) {
                                    numberElement.textContent =
                                        displayNumber;
                                }

                                if (titleElement) {
                                    titleElement.textContent =
                                        description;
                                }

                            })
                            .catch(function (error) {
                                console.warn(
                                    "BULK JURISPRUDENCE CAPTION LOAD FAILED:",
                                    law.id,
                                    error
                                );
                            });
                    }
                }

                lawList.appendChild(button);

                /*
                 * Jurisprudence:
                 * Browse records are lightweight and may report 0 provisions
                 * even when the existing full record contains case text.
                 *
                 * Display-only: update only this card's count after loading
                 * the existing full record. Database remains unchanged.
                 */
                if (
                    false &&
                    selectedType === "Jurisprudence" &&
                    Number(law.articleCount || 0) === 0
                ) {
                    window.philippineLawsAPI
                        .getLawById(law.id)
                        .then(function (fullLaw) {

                            if (!fullLaw) {
                                return;
                            }

                            const fullText =
                                String(fullLaw.text || "").trim();

                            const fullArticles =
                                Array.isArray(fullLaw.articles)
                                    ? fullLaw.articles
                                    : [];

                            const realCount =
                                fullArticles.length > 0
                                    ? fullArticles.length
                                    : (fullText ? 1 : 0);

                            if (realCount > 0) {
                                const countElement =
                                    button.querySelector(".law-count");

                                if (countElement) {
                                    countElement.textContent =
                                        realCount +
                                        (realCount === 1
                                            ? " provision"
                                            : " provisions");
                                }
                            }
                        })
                        .catch(function (error) {
                            console.warn(
                                "JURISPRUDENCE COUNT LOAD FAILED:",
                                law.id,
                                error
                            );
                        });
                }
            });

            if (categoryLaws.length === 0) {

                lawList.innerHTML =
                    '<div style="padding:20px;">' +
                    "No laws found in this category." +
                    "</div>";
            }
        })
        .catch(function (error) {

            console.error(
                "FAILED TO LOAD CATEGORY LAWS:",
                error
            );

            lawList.innerHTML =
                '<div style="padding:20px;color:#b00020;">' +
                "<strong>Unable to load laws.</strong><br><br>" +
                escapeHtml(
                    error.message ||
                    String(error)
                ) +
                "</div>";
        });
}

/* =========================================================
   LAW SELECTION
   ========================================================= */

function selectLaw(law) {

    selectedLaw = law;
    selectedArticleNumber = null;

    if (browseView) {
        browseView.classList.remove("hidden");
    }

    if (categoryView) {
        categoryView.classList.add("hidden");
    }

    if (lawView) {
        lawView.classList.add("hidden");
    }

    if (selectedLawView) {
        selectedLawView.classList.remove("hidden");
    }

    if (articleView) {
        articleView.classList.add("hidden");
    }

    if (selectedLawNumber) {
        selectedLawNumber.textContent =
            getLawNumber(law);
    }

    if (selectedLawTitle) {
        selectedLawTitle.textContent =
            cleanLawTitle(law);
    }

    const articles =
        getArticles(law);

    if (selectedLawCount) {

        const count =
            articles.length;

        selectedLawCount.textContent =
            count +
            (
                count === 1
                    ? " provision"
                    : " provisions"
            );
    }

    buildArticleDropdown();

    renderSelectedArticle();
}


/* =========================================================
   ARTICLE GROUPS
   ========================================================= */

function getArticleGroups() {

    const articles =
        getArticles(selectedLaw);

    const groups = [];
    const map = new Map();

    if (!articles.length) {
        return groups;
    }

    articles.forEach(function (article, index) {

        let groupNumber = null;
        let groupTitle = "";

        if (article.article_number) {

            groupNumber =
                String(
                    article.article_number
                ).trim();

            groupTitle =
                article.article_title ||
                "";

        }
        else if (article.article) {

            groupNumber =
                String(
                    article.article
                ).trim();

            groupTitle =
                article.article_title ||
                "";

        }
        else if (article.chapter_number) {

            groupNumber =
                String(
                    article.chapter_number
                ).trim();

            groupTitle =
                article.chapter_title ||
                "";

        }
        else if (article.chapter) {

            groupNumber =
                String(
                    article.chapter
                ).trim();

            groupTitle =
                article.chapter_title ||
                "";

        }
        else if (article.title_number) {

            groupNumber =
                String(
                    article.title_number
                ).trim();

            groupTitle =
                article.title_title ||
                "";

        }
        else if (article.title) {

            groupNumber =
                String(
                    article.title
                ).trim();

            groupTitle =
                article.title_title ||
                "";

        }
        else if (article.part) {

            groupNumber =
                String(
                    article.part
                ).trim();

            groupTitle =
                article.part_title ||
                "";

        }
        else if (article.division) {

            groupNumber =
                String(
                    article.division
                ).trim();

            groupTitle =
                article.division_title ||
                "";

        }
        else {

            groupNumber =
                "ALL PROVISIONS";

            groupTitle = "";
        }

        if (!groupNumber) {
            groupNumber =
                "ALL PROVISIONS";
        }

        if (!map.has(groupNumber)) {

            const group = {
                number: groupNumber,
                title: groupTitle,
                indices: []
            };

            map.set(
                groupNumber,
                group
            );

            groups.push(group);
        }

        map.get(groupNumber)
            .indices
            .push(index);
    });

    return groups;
}


/* =========================================================
   ARTICLE DROPDOWN
   ========================================================= */

function buildArticleDropdown() {

    if (!articleSelector) {
        console.error(
            "articleSelector element not found."
        );
        return;
    }

    const container =
        document.getElementById(
            "articleSelectorContainer"
        );

    const lawType =
        String(
            selectedLaw &&
            selectedLaw.type ||
            ""
        )
        .trim()
        .toLowerCase();

    const lawNumber =
        String(
            selectedLaw &&
            selectedLaw.number ||
            ""
        )
        .trim()
        .toLowerCase();

    const lawTitle =
        String(
            selectedLaw &&
            selectedLaw.title ||
            ""
        )
        .trim()
        .toLowerCase();

    const isConstitution =
        lawType === "constitution";

    if (isConstitution) {

        articleSelector.innerHTML = "";

        const groups =
            getArticleGroups();

        groups.forEach(function (group) {

            const option =
                document.createElement("option");

            option.value =
                group.number;

            option.textContent =
                group.title
                    ? group.number +
                      " — " +
                      group.title
                    : group.number;

            articleSelector.appendChild(
                option
            );
        });

        if (groups.length > 0) {

            selectedArticleNumber =
                groups[0].number;

            articleSelector.value =
                selectedArticleNumber;
        }

        if (container) {
            container.style.display = "";
        }

        return;
    }

    articleSelector.innerHTML = "";

    selectedArticleNumber = null;

    if (container) {
        container.style.display = "none";
    }
}


function renderSelectedArticle() {

    if (!sectionList) {
        console.error(
            "sectionList element not found."
        );
        return;
    }

    sectionList.innerHTML = "";

    if (!selectedLaw) {
        return;
    }

    const articles =
        getArticles(selectedLaw);

    let visibleArticles =
        articles;

    if (
        selectedArticleNumber &&
        selectedArticleNumber !==
            "ALL PROVISIONS"
    ) {

        visibleArticles =
            articles.filter(function (article) {

                const number =
                    String(
                        article.article_number ||
                        article.article ||
                        ""
                    ).trim();

                return (
                    number ===
                    selectedArticleNumber
                );
            });
    }

    visibleArticles.forEach(
        function (article) {

            const card =
                document.createElement("div");

            card.className =
                "section-card";

            const heading =
                document.createElement("div");

            heading.className =
                "section-heading";

            heading.textContent =
                article.number ||
                "Provision";

            card.appendChild(
                heading
            );

            const title =
                String(
                    article.title ||
                    ""
                ).trim();

            let articleText =
                String(
                    article.text ||
                    ""
                ).trim();

            /*
             * Display-only OCR readability cleanup.
             *
             * This function changes only what is displayed.
             * Database contents remain unchanged.
             *
             * Safe cases:
             * - OCR replacement characters used as quotation marks
             * - OCR replacement characters used as apostrophes
             * - separator characters around words/signatures
             * - common uppercase Ñ corruption
             *
             * Unknown OCR tokens are deliberately left alone.
             */
            function cleanDisplayedArticleText(value) {

                return String(
                    value ||
                    ""
                )
                    .trim()

                    /*
                     * Remove known OCR garbage.
                     * Display-only; database unchanged.
                     */
                    .replace(
                        /�шphi1/gi,
                        ""
                    )

                    /*
                     * Recover common uppercase Ñ corruption first.
                     */
                    .replace(
                        /\b([A-Z][A-Z]+)�([A-Z])\b/g,
                        function (match, left, right) {
                            return left + "Ñ" + right;
                        }
                    )

                    /*
                     * Recover apostrophes.
                     */
                    .replace(
                        /([A-Za-z])�s\b/g,
                        "$1's"
                    )

                    /*
                     * Replacement characters immediately after
                     * punctuation/signatures are separators.
                     */
                    .replace(
                        /([.!?:;,)])�+/g,
                        "$1 "
                    )

                    .replace(
                        /(["'])�+/g,
                        "$1"
                    )

                    /*
                     * Leading/trailing OCR separators.
                     */
                    .replace(
                        /^�+/,
                        ""
                    )

                    .replace(
                        /�+$/g,
                        ""
                    )

                    /*
                     * Remaining replacement characters are treated
                     * as unreadable separators in displayed text.
                     *
                     * This is intentionally display-only.
                     */
                    .replace(
                        /�+/g,
                        " "
                    )

                    /*
                     * Normalize whitespace created by cleanup.
                     */
                    .replace(
                        /\s{2,}/g,
                        " "
                    )
                    .trim();
            }

            articleText =
                cleanDisplayedArticleText(
                    articleText
                );

            /*
             * Some laws use Article I, Article II, etc.
             * as structural headings rather than substantive
             * legal provisions.
             *
             * Also handle headings such as:
             * "- GENERAL PROVISIONS"
             */

            const isRomanArticleHeading =
                article.unit_type === "Article" &&
                /^Article\s+[IVXLCDM]+$/i.test(
                    String(
                        article.number ||
                        ""
                    ).trim()
                ) &&
                !title;

            const headingText =
                articleText
                    .replace(
                        /^[\s.:-–—]+/,
                        ""
                    )
                    .trim();

            const isShortStructuralHeading =
                article.unit_type === "Article" &&
                !title &&
                /^[A-Z0-9][A-Z0-9\s&,'’()\/-]{2,120}$/.test(
                    headingText
                ) &&
                articleText.length <= 140;

            const isStructuralHeading =
                isRomanArticleHeading ||
                isShortStructuralHeading;

            if (isStructuralHeading) {

                if (headingText) {

                    const structuralTitle =
                        document.createElement("div");

                    structuralTitle.className =
                        "section-text";

                    structuralTitle.textContent =
                        headingText;

                    card.appendChild(
                        structuralTitle
                    );
                }

                sectionList.appendChild(
                    card
                );

                return;
            }

            /*
             * Display the database title separately from
             * the provision text when one exists.
             */

            if (title) {

                const titleElement =
                    document.createElement("div");

                titleElement.className =
                    "section-text";

                titleElement.textContent =
                    title;

                card.appendChild(
                    titleElement
                );
            }

            const text =
                document.createElement("div");

            text.className =
                "section-text";

            text.textContent =
                articleText;

            card.appendChild(
                text
            );

            /*
             * Existing Note / Copy behavior
             * remains unchanged for substantive provisions.
             */

            const actions =
                document.createElement("div");

            actions.className =
                "section-actions";

            const note =
                document.createElement("button");

            note.type =
                "button";

            note.textContent =
                "📝 Add Note";

            note.addEventListener(
                "click",
                function () {
                    window.openPhilippineLawNoteEditor(
                        article
                    );
                }
            );

            const copy =
                document.createElement("button");

            copy.type =
                "button";

            copy.textContent =
                "📋 Copy";

            copy.addEventListener(
                "click",
                function () {
                    copyProvision(
                        article
                    );
                }
            );

            actions.appendChild(
                note
            );

            actions.appendChild(
                copy
            );

            card.appendChild(
                actions
            );

            sectionList.appendChild(
                card
            );
        }
    );

    if (visibleArticles.length === 0) {

        sectionList.innerHTML =
            '<div style="padding:20px;">' +
            "No provisions found." +
            "</div>";
    }
}

/* =========================================================
   ARTICLE DROPDOWN EVENT
   ========================================================= */

if (articleSelector) {

    articleSelector.addEventListener(
        "change",
        function () {

            selectedArticleNumber =
                articleSelector.value;

            renderSelectedArticle();
        }
    );
}


/* =========================================================
   BACK TO CATEGORIES
   ========================================================= */

if (lawBackButton) {

    lawBackButton.addEventListener(
        "click",
        function () {
            showCategories();
        }
    );
}


/* =========================================================
   BACK TO LAW LIST
   ========================================================= */

if (selectedLawBackButton) {

    selectedLawBackButton.addEventListener(
        "click",
        function () {

            if (selectedCategory) {
                showLaws(
                    selectedCategory
                );
            }
            else {
                showCategories();
            }
        }
    );
}


/* =========================================================
   OLD ARTICLE READER
   ========================================================= */

if (articleBackButton) {

    articleBackButton.addEventListener(
        "click",
        function () {

            if (articleView) {
                articleView.classList.add(
                    "hidden"
                );
            }

            if (selectedLawView) {
                selectedLawView.classList.remove(
                    "hidden"
                );
            }
        }
    );
}


/* =========================================================
   LAW OF THE DAY
   ========================================================= */

function showLawOfTheDay() {

    const storageKey =
        "philippine_law_of_the_day";

    const now =
        Date.now();

    const twentyFourHours =
        24 * 60 * 60 * 1000;

    let saved = null;

    try {

        saved =
            JSON.parse(
                localStorage.getItem(
                    storageKey
                ) || "null"
            );

    }
    catch (error) {

        console.error(
            "Unable to read Law of the Day:",
            error
        );

        saved = null;
    }


    /*
     * First try to restore the saved Law of the Day.
     *
     * IMPORTANT:
     * Do NOT call the random SQLite Law of the Day API
     * until we know there is no valid saved law.
     */
    let lawPromise = null;

    if (
        saved &&
        saved.lawId &&
        saved.timestamp &&
        (
            now -
            Number(saved.timestamp)
        ) <
        twentyFourHours
    ) {

        lawPromise =
            window.philippineLawsAPI
                .getLawById(saved.lawId);

    }
    else {

        lawPromise =
            window.philippineLawsAPI
                .getLawOfTheDay();
    }


    lawPromise
        .then(function (law) {

            if (!law) {
                console.error(
                    "Law of the Day: no law was returned."
                );
                return;
            }

            const articles =
                getArticles(law);

            if (!articles.length) {
                console.error(
                    "Law of the Day: selected law has no articles.",
                    law.id
                );
                return;
            }


            let article = null;


            /*
             * Restore the saved article when the saved law
             * is still valid.
             */
            if (
                saved &&
                saved.lawId === law.id &&
                saved.timestamp &&
                (
                    now -
                    Number(saved.timestamp)
                ) <
                twentyFourHours
            ) {

                article =
                    articles.find(
                        function (item) {

                            const number =
                                item.number ||
                                item.article_number ||
                                item.article ||
                                "";

                            return (
                                String(number) ===
                                String(
                                    saved.articleNumber ||
                                    ""
                                )
                            );
                        }
                    );

            }


            /*
             * If there is no valid saved article,
             * select a new article and save the law.
             */
            if (!article) {

                article =
                    articles[
                        Math.floor(
                            Math.random() *
                            articles.length
                        )
                    ];

                try {

                    const articleNumber =
                        article.number ||
                        article.article_number ||
                        article.article ||
                        "";

                    localStorage.setItem(
                        storageKey,
                        JSON.stringify({
                            lawId:
                                law.id,

                            lawNumber:
                                getLawNumber(law),

                            articleNumber:
                                String(
                                    articleNumber
                                ),

                            timestamp:
                                now
                        })
                    );

                    console.log(
                        "NEW OFFLINE LAW OF THE DAY SAVED:",
                        getLawNumber(law),
                        articleNumber
                    );

                }
                catch (error) {

                    console.error(
                        "Unable to save Law of the Day:",
                        error
                    );
                }

            }
            else {

                console.log(
                    "RESTORED OFFLINE LAW OF THE DAY:",
                    getLawNumber(law),
                    article.number ||
                    article.article_number ||
                    article.article ||
                    "Provision"
                );
            }


            lawOfDayArticle =
                article;


            /*
             * Show the dedicated Law of the Day view.
             */
            if (browseView) {
                browseView.classList.add("hidden");
            }

            if (categoryView) {
                categoryView.classList.add("hidden");
            }

            if (lawView) {
                lawView.classList.add("hidden");
            }

            if (selectedLawView) {
                selectedLawView.classList.add("hidden");
            }

            if (articleView) {
                articleView.classList.add("hidden");
            }

            if (lawOfDayView) {
                lawOfDayView.classList.remove("hidden");
            }


            if (lawOfDayNumber) {

                lawOfDayNumber.textContent =
                    getLawNumber(law);
            }


            if (lawOfDayTitle) {

                lawOfDayTitle.textContent =
                    cleanLawTitle(law);
            }


            if (lawOfDayProvisionNumber) {

                lawOfDayProvisionNumber.textContent =
                    article.number ||
                    article.article_number ||
                    article.article ||
                    "Provision";
            }


            if (lawOfDayProvisionText) {

                lawOfDayProvisionText.textContent =
                    cleanDisplayedArticleText(
                        article.text
                    );
            }


            console.log(
                "LAW OF THE DAY:",
                getLawNumber(law),
                article.number ||
                article.article_number ||
                article.article ||
                "Provision"
            );
        })
        .catch(function (error) {

            console.error(
                "Law of the Day failed:",
                error
            );
        });
}


if (lawOfDayBackButton) {

    lawOfDayBackButton.addEventListener(
        "click",
        function () {

            if (lawOfDayView) {
                lawOfDayView.classList.add(
                    "hidden"
                );
            }

            if (selectedLaw) {

                if (browseView) {
                    browseView.classList.remove(
                        "hidden"
                    );
                }

                if (selectedLawView) {
                    selectedLawView.classList.remove(
                        "hidden"
                    );
                }

                if (categoryView) {
                    categoryView.classList.add(
                        "hidden"
                    );
                }

                if (lawView) {
                    lawView.classList.add(
                        "hidden"
                    );
                }

                if (articleView) {
                    articleView.classList.add(
                        "hidden"
                    );
                }

            }
            else {

                showCategories();

            }
        }
    );
}


if (lawOfDayNoteButton) {

    lawOfDayNoteButton.addEventListener(
        "click",
        function () {

            if (!lawOfDayArticle) {
                return;
            }

            const previousLaw =
                selectedLaw;

            selectedLaw =
                laws.find(
                    function (law) {

                        return (
                            getLawNumber(law) ===
                            lawOfDayNumber.textContent
                        );
                    }
                ) || selectedLaw;

            if (selectedLaw) {

                if (lawOfDayView) {
                    lawOfDayView.classList.add(
                        "hidden"
                    );
                }

                window.openPhilippineLawNoteEditor(
                    lawOfDayArticle
                );
            }

            /*
             * Keep the previous law selection intact
             * when returning to the normal reader.
             */
            if (previousLaw) {
                selectedLaw = previousLaw;
            }
        }
    );
}


if (lawOfDayCopyButton) {

    lawOfDayCopyButton.addEventListener(
        "click",
        function () {

            if (!lawOfDayArticle) {
                return;
            }

            const previousLaw =
                selectedLaw;

            selectedLaw =
                laws.find(
                    function (law) {

                        return (
                            getLawNumber(law) ===
                            lawOfDayNumber.textContent
                        );
                    }
                ) || selectedLaw;

            if (selectedLaw) {
                copyProvision(
                    lawOfDayArticle
                );
            }

            selectedLaw =
                previousLaw;
        }
    );
}


/* =========================================================
   NOTES
   ========================================================= */

function addNote(article) {

    const note =
        prompt(
            "Add a note for " +
            (article.number || "this section") +
            ":"
        );

    if (
        note === null ||
        !note.trim()
    ) {
        return;
    }

    const key =
        "philippine_laws_notes";

    let notes = [];

    try {
        notes =
            JSON.parse(
                localStorage.getItem(key) ||
                "[]"
            );
    }
    catch (error) {
        notes = [];
    }

    notes.push({

        law:
            getLawNumber(selectedLaw),

        title:
            cleanLawTitle(selectedLaw),

        number:
            article.number || "",

        text:
            article.text || "",

        note:
            note.trim(),

        saved:
            new Date().toISOString()
    });

    localStorage.setItem(
        key,
        JSON.stringify(notes)
    );

    alert(
        "Note saved."
    );
}


/* =========================================================
   COPY
   ========================================================= */

function copyProvision(article) {

    const text =
        (
            getLawNumber(selectedLaw) +
            "\n" +
            cleanLawTitle(selectedLaw) +
            "\n\n" +
            (article.number || "") +
            "\n" +
            (article.text || "")
        ).trim();

    navigator.clipboard.writeText(
        text
    )
    .then(function () {

        alert(
            "Section copied."
        );
    })
    .catch(function () {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value = text;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();

        alert(
            "Section copied."
        );
    });
}


/* =========================================================
   OLD OPEN ARTICLE BUTTON
   ========================================================= */

if (openArticleButton) {

    openArticleButton.addEventListener(
        "click",
        function () {

            renderSelectedArticle();
        }
    );
}


/* =========================================================
   TOP BUTTONS
   ========================================================= */

const notesButton =
    document.getElementById(
        "notesButton"
    );

if (notesButton) {

    notesButton.addEventListener(
        "click",
        function () {

            alert(
                "Notes are saved locally in this app."
            );
        }
    );
}


const settingsButton =
    document.getElementById(
        "settingsButton"
    );

const settingsView =
    document.getElementById(
        "settingsView"
    );

const settingsBackButton =
    document.getElementById(
        "settingsBackButton"
    );

if (settingsButton) {

    settingsButton.addEventListener(
        "click",
        function () {

            if (browseView) {
                browseView.classList.add(
                    "hidden"
                );
            }

            if (articleView) {
                articleView.classList.add(
                    "hidden"
                );
            }


            if (notesView) {
                notesView.classList.add(
                    "hidden"
                );
            }

            if (noteEditorView) {
                noteEditorView.classList.add(
                    "hidden"
                );
            }

            if (lawOfDayView) {
                lawOfDayView.classList.add(
                    "hidden"
                );
            }

            if (settingsView) {
                settingsView.classList.remove(
                    "hidden"
                );
            }
        }
    );
}

if (settingsBackButton) {

    settingsBackButton.addEventListener(
        "click",
        function () {

            if (settingsView) {
                settingsView.classList.add(
                    "hidden"
                );
            }

            if (browseView) {
                browseView.classList.remove(
                    "hidden"
                );
            }
        }
    );
}


/* =========================================================
   SETTINGS FUNCTIONALITY
   ========================================================= */

const themeSetting =
    document.getElementById(
        "themeSetting"
    );

const textSizeSetting =
    document.getElementById(
        "textSizeSetting"
    );


function applyAppSettings() {

    const savedTheme =
        localStorage.getItem(
            "philippine_laws_theme"
        ) || "light";

    const savedTextSize =
        localStorage.getItem(
            "philippine_laws_text_size"
        ) || "normal";


    if (themeSetting) {

        themeSetting.value =
            savedTheme;

    }


    if (textSizeSetting) {

        textSizeSetting.value =
            savedTextSize;

    }


    document.body.classList.remove(
        "theme-light",
        "theme-dark",
        "text-size-small",
        "text-size-normal",
        "text-size-large"
    );


    document.body.classList.add(
        savedTheme === "dark"
            ? "theme-dark"
            : "theme-light"
    );


    document.body.classList.add(
        "text-size-" +
        (
            savedTextSize === "small"
                ? "small"
                : savedTextSize === "large"
                    ? "large"
                    : "normal"
        )
    );
}


if (themeSetting) {

    themeSetting.addEventListener(
        "change",
        function () {

            localStorage.setItem(
                "philippine_laws_theme",
                themeSetting.value
            );

            applyAppSettings();

        }
    );
}


if (textSizeSetting) {

    textSizeSetting.addEventListener(
        "change",
        function () {

            localStorage.setItem(
                "philippine_laws_text_size",
                textSizeSetting.value
            );

            applyAppSettings();

        }
    );
}


applyAppSettings();


/* =========================================================
   BOTTOM BUTTONS
   ========================================================= */

const bottomNotes =
    document.getElementById(
        "bottomNotes"
    );

if (bottomNotes) {

    bottomNotes.addEventListener(
        "click",
        function () {

            alert(
                "Notes are saved locally in this app."
            );
        }
    );
}


const lawOfDayButton =
    document.getElementById(
        "lawOfDayButton"
    );

if (lawOfDayButton) {

    lawOfDayButton.addEventListener(
        "click",
        function () {

            showLawOfTheDay();

        }
    );
}


const supportButton =
    document.getElementById(
        "supportButton"
    );

const supportView =
    document.getElementById(
        "supportView"
    );

const supportBackButton =
    document.getElementById(
        "supportBackButton"
    );

if (supportButton) {

    supportButton.addEventListener(
        "click",
        function () {

            if (browseView) browseView.classList.add("hidden");
            if (articleView) articleView.classList.add("hidden");
            if (notesView) notesView.classList.add("hidden");
            if (noteEditorView) noteEditorView.classList.add("hidden");
            if (lawOfDayView) lawOfDayView.classList.add("hidden");
            if (settingsView) settingsView.classList.add("hidden");

            if (supportView) {
                supportView.classList.remove("hidden");
            }
        }
    );
}

if (supportBackButton) {

    supportBackButton.addEventListener(
        "click",
        function () {

            if (supportView) {
                supportView.classList.add("hidden");
            }

            if (browseView) {
                browseView.classList.remove("hidden");
            }
        }
    );
}


/* =========================================================
   SECTION CARD STYLING
   ========================================================= */

const sectionStyle =
document.createElement("style");

sectionStyle.textContent = `

.section-card {
    padding: 20px 0;
    border-bottom: 1px solid #d8d2c8;
}

.section-heading {
    font-size: 19px;
    font-weight: bold;
    margin-bottom: 12px;
}

.section-text {
    font-size: 16px;
    line-height: 1.75;
    white-space: pre-wrap;
    margin-bottom: 15px;
}

.section-actions {
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
}

.section-actions button {
    border: none;
    background: none;
    cursor: pointer;
    padding: 5px 0;
    font-size: 14px;
}

.section-actions button:hover {
    text-decoration: underline;
}

`;

document.head.appendChild(
    sectionStyle
);

console.log(
    "RENDERER INITIALIZATION COMPLETE."
);

console.timeEnd("APP STARTUP TOTAL");


/* =========================================================
   NOTES VIEWER
   ISOLATED ADDITION - DOES NOT MODIFY LAW READER
   ========================================================= */

(function () {

    const notesView =
        document.getElementById("notesView");

    const notesList =
        document.getElementById("notesList");

    const notesBackButton =
        document.getElementById("notesBackButton");

    const notesButtons = [
        document.getElementById("notesButton"),
        document.getElementById("bottomNotes")
    ];

    function getSavedNotes() {

        try {

            const notes =
                JSON.parse(
                    localStorage.getItem(
                        "philippine_laws_notes"
                    ) || "[]"
                );

            return Array.isArray(notes)
                ? notes
                : [];

        }
        catch (error) {

            console.error(
                "Unable to read saved notes:",
                error
            );

            return [];
        }
    }


    function renderNotes() {

        if (!notesList) {
            return;
        }

        const notes =
            getSavedNotes();

        notesList.innerHTML = "";

        if (notes.length === 0) {

            notesList.innerHTML =
                '<div style="padding:20px;text-align:center;color:#666;">' +
                "No saved notes yet." +
                "</div>";

            return;
        }

        notes.forEach(
            function (item, index) {

                const card =
                    document.createElement("div");

                card.className =
                    "section-card";


                const heading =
                    document.createElement("div");

                heading.className =
                    "section-heading";

                heading.textContent =
                    (
                        item.law ||
                        "Philippine Law"
                    ) +
                    (
                        item.number
                        ? " — " + item.number
                        : ""
                    );

                card.appendChild(
                    heading
                );


                const title =
                    document.createElement("div");

                title.className =
                    "section-title-text";

                title.textContent =
                    item.title || "";

                card.appendChild(
                    title
                );


                const note =
                    document.createElement("div");

                note.className =
                    "section-text";

                note.textContent =
                    item.note || "";

                card.appendChild(
                    note
                );


                const actions =
                    document.createElement("div");

                actions.className =
                    "section-actions";


                const deleteButton =
                    document.createElement("button");

                deleteButton.type =
                    "button";

                deleteButton.textContent =
                    "🗑 Delete Note";

                /*
                 * Store the actual note index directly
                 * on the button.
                 *
                 * This avoids relying on a stale closure
                 * if the Notes list is refreshed.
                 */
                deleteButton.dataset.noteIndex =
                    String(index);

                deleteButton.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();

                        const noteIndex =
                            Number(
                                event.currentTarget
                                    .dataset
                                    .noteIndex
                            );

                        deleteNote(
                            noteIndex
                        );
                    }
                );

                actions.appendChild(
                    deleteButton
                );

                card.appendChild(
                    actions
                );

                notesList.appendChild(
                    card
                );
            }
        );
    }


    function showNotes() {

        renderNotes();

        if (browseView) {
            browseView.classList.add(
                "hidden"
            );
        }

        if (articleView) {
            articleView.classList.add(
                "hidden"
            );
        }

        if (notesView) {
            notesView.classList.remove(
                "hidden"
            );
        }
    }


    function deleteNote(index) {

        const notes =
            getSavedNotes();

        const noteIndex =
            Number(index);

        if (
            !Number.isInteger(noteIndex) ||
            noteIndex < 0 ||
            noteIndex >= notes.length
        ) {

            console.error(
                "Invalid note index:",
                index
            );

            return;
        }

        const confirmed =
            window.confirm(
                "Delete this note?"
            );

        if (!confirmed) {
            return;
        }

        notes.splice(
            noteIndex,
            1
        );

        try {

            localStorage.setItem(
                "philippine_laws_notes",
                JSON.stringify(notes)
            );

        }
        catch (error) {

            console.error(
                "Unable to save deleted notes:",
                error
            );

            alert(
                "Unable to delete this note."
            );

            return;
        }

        renderNotes();

        console.log(
            "Note deleted. Remaining notes:",
            notes.length
        );
    }


    function returnFromNotes() {

        if (notesView) {
            notesView.classList.add(
                "hidden"
            );
        }

        if (selectedLaw) {

            if (browseView) {
                browseView.classList.remove(
                    "hidden"
                );
            }

            if (selectedLawView) {
                selectedLawView.classList.remove(
                    "hidden"
                );
            }

            if (categoryView) {
                categoryView.classList.add(
                    "hidden"
                );
            }

            if (lawView) {
                lawView.classList.add(
                    "hidden"
                );
            }

            if (articleView) {
                articleView.classList.add(
                    "hidden"
                );
            }

        }
        else {

            showCategories();
        }
    }


    notesButtons.forEach(
        function (button) {

            if (!button) {
                return;
            }

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    showNotes();
                }
            );
        }
    );


    if (notesBackButton) {

        notesBackButton.addEventListener(
            "click",
            function () {

                returnFromNotes();
            }
        );
    }


    window.showPhilippineLawNotes =
        showNotes;


    console.log(
        "NOTES VIEWER INITIALIZATION COMPLETE."
    );

})();


/* =========================================================
   IN-APP NOTE EDITOR CONNECTION
   STABLE VERSION
   ========================================================= */

(function () {

    const noteEditorView =
        document.getElementById("noteEditorView");

    const noteEditorLaw =
        document.getElementById("noteEditorLaw");

    const noteEditorProvision =
        document.getElementById("noteEditorProvision");

    const noteEditorText =
        document.getElementById("noteEditorText");

    const noteEditorSaveButton =
        document.getElementById("noteEditorSaveButton");

    const noteEditorCancelButton =
        document.getElementById("noteEditorCancelButton");

    const noteEditorBackButton =
        document.getElementById("noteEditorBackButton");

    let noteArticle = null;


    function openNoteEditor(article) {

        if (!noteEditorView || !noteEditorText) {
            console.error(
                "NOTE EDITOR: required elements not found."
            );
            return;
        }

        noteArticle = article || {};

        if (noteEditorLaw) {
            noteEditorLaw.textContent =
                getLawNumber(selectedLaw) +
                " — " +
                cleanLawTitle(selectedLaw);
        }

        if (noteEditorProvision) {
            noteEditorProvision.textContent =
                noteArticle.number ||
                "Provision";
        }

        /*
         * Reset the editor every time it is opened.
         */
        noteEditorText.disabled = false;
        noteEditorText.readOnly = false;
        noteEditorText.value = "";

        /*
         * Hide every other application view.
         */
        if (browseView) {
            browseView.classList.add("hidden");
        }

        if (articleView) {
            articleView.classList.add("hidden");
        }

        if (notesView) {
            notesView.classList.add("hidden");
        }


        if (noteEditorView) {
            noteEditorView.classList.remove("hidden");
        }

        /*
         * Focus immediately after the editor becomes visible.
         * No delayed timer is used.
         */
        noteEditorText.disabled = false;
        noteEditorText.readOnly = false;
        noteEditorText.focus();

        console.log(
            "NOTE EDITOR OPENED:",
            noteArticle.number || "Provision"
        );
    }


    window.openPhilippineLawNoteEditor =
        openNoteEditor;


    function closeNoteEditor() {

        console.time("NOTE CLOSE TOTAL");

        if (noteEditorView) {
            console.time("NOTE CLOSE HIDE EDITOR");
            noteEditorView.classList.add("hidden");
            console.timeEnd("NOTE CLOSE HIDE EDITOR");
        }

        if (selectedLaw) {

            if (browseView) {
                browseView.classList.remove("hidden");
            }

            if (selectedLawView) {
                selectedLawView.classList.remove("hidden");
            }

            if (categoryView) {
                categoryView.classList.add("hidden");
            }

            if (lawView) {
                lawView.classList.add("hidden");
            }

            if (articleView) {
                articleView.classList.add("hidden");
            }

            if (notesView) {
                notesView.classList.add("hidden");
            }


            console.timeEnd("NOTE CLOSE RESTORE SELECTED LAW");

        }
        else {

            console.time("NOTE CLOSE SHOW CATEGORIES");
            showCategories();
            console.timeEnd("NOTE CLOSE SHOW CATEGORIES");

        }

        noteArticle = null;

        console.log(
            "NOTE EDITOR CLOSED."
        );

        console.timeEnd("NOTE CLOSE TOTAL");
    }


    function saveNoteFromEditor() {

        if (!noteArticle) {

            console.error(
                "NOTE EDITOR: no article selected."
            );

            return;
        }

        const note =
            noteEditorText
                ? noteEditorText.value.trim()
                : "";

        if (!note) {

            alert(
                "Please write a note first."
            );

            if (noteEditorText) {
                noteEditorText.focus();
            }

            return;
        }

        const key =
            "philippine_laws_notes";

        let notes = [];

        try {

            notes =
                JSON.parse(
                    localStorage.getItem(key) ||
                    "[]"
                );

            if (!Array.isArray(notes)) {
                notes = [];
            }

        }
        catch (error) {

            console.error(
                "Unable to read saved notes:",
                error
            );

            notes = [];
        }

        notes.push({

            law:
                getLawNumber(selectedLaw),

            title:
                cleanLawTitle(selectedLaw),

            number:
                noteArticle.number || "",

            text:
                noteArticle.text || "",

            note:
                note,

            saved:
                new Date().toISOString()

        });

        try {

            localStorage.setItem(
                key,
                JSON.stringify(notes)
            );

        }
        catch (error) {

            console.error(
                "Unable to save note:",
                error
            );

            alert(
                "Unable to save this note."
            );

            return;
        }

        /*
         * Close immediately after saving.
         * No blocking alert is used so another note
         * can be opened and edited immediately.
         */
        closeNoteEditor();
    }


    /*
     * Use direct onclick properties.
     *
     * This guarantees that reopening the editor does not
     * accumulate multiple click handlers.
     */

    if (noteEditorSaveButton) {

        noteEditorSaveButton.onclick =
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                saveNoteFromEditor();

                return false;
            };
    }


    if (noteEditorCancelButton) {

        noteEditorCancelButton.onclick =
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                closeNoteEditor();

                return false;
            };
    }


    if (noteEditorBackButton) {

        noteEditorBackButton.onclick =
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                closeNoteEditor();

                return false;
            };
    }


    if (noteEditorText) {

        noteEditorText.onmousedown =
            function (event) {

                event.stopPropagation();
            };

        noteEditorText.onclick =
            function (event) {

                event.stopPropagation();

                noteEditorText.focus();
            };

        noteEditorText.onkeydown =
            function (event) {

                event.stopPropagation();
            };
    }


    console.log(
        "STABLE NOTE EDITOR CONNECTION INITIALIZED."
    );

})();

