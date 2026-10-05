const {
    app,
    BrowserWindow,
    Menu,
    ipcMain
} = require('electron');

const {
    DatabaseSync
} = require('node:sqlite');

const path = require('path');

let runtimeDb = null;

function openRuntimeDatabase() {

    const packagedDbPath = app.isPackaged
        ? path.join(
            process.resourcesPath,
            'app.asar.unpacked',
            'data',
            'runtime_laws.sqlite3'
        )
        : path.join(
            __dirname,
            'data',
            'runtime_laws.sqlite3'
        );

    const userDbPath = path.join(
        app.getPath('userData'),
        'runtime_laws.sqlite3'
    );

    const fs = require('fs');

    if (!fs.existsSync(userDbPath)) {
        fs.copyFileSync(
            packagedDbPath,
            userDbPath
        );
    }

    runtimeDb = new DatabaseSync(
        userDbPath,
        {
            readOnly: true
        }
    );

    console.log(
        'RUNTIME SQLITE DATABASE OPENED:',
        userDbPath
    );
}

function parseJson(value, fallback) {

    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(
            'JSON PARSE ERROR:',
            error
        );

        return fallback;
    }
}


/* =========================================================
   SQLITE IPC
   ========================================================= */

ipcMain.handle(
    'laws:getCategories',
    function () {

        const rows =
            runtimeDb.prepare(
                `SELECT DISTINCT type
                 FROM laws
                 WHERE type IS NOT NULL
                   AND TRIM(type) <> ''
                 ORDER BY type COLLATE NOCASE`
            ).all();

        return rows.map(
            function (row) {
                return row.type;
            }
        );
    }
);


ipcMain.handle(
    'laws:getLawsByType',
    function (event, type) {

        const rows =
            runtimeDb.prepare(
                `SELECT
                    id,
                    number,
                    type,
                    title,
                    subjects,
                    substr(text, 1, 4000) AS titleSource,
                    json_array_length(articles) AS articleCount
                 FROM laws
                 WHERE type = ?
                 ORDER BY
                    CASE
                        WHEN type = 'Memorandum Order'
                        THEN CAST(number AS INTEGER)
                        ELSE 0
                    END,
                    number COLLATE NOCASE`
            ).all(type);

        return rows.map(
            function (row) {

                return {
                    id: row.id,
                    number: row.number,
                    type: row.type,
                    title: row.title,
                    subjects: parseJson(
                        row.subjects,
                        []
                    ),
                    titleSource:
                        row.titleSource || '',
                    articleCount:
                        Number(
                            row.articleCount || 0
                        )
                };
            }
        );
    }
);


ipcMain.handle(
    'laws:getLawById',
    function (event, id) {

        const row =
            runtimeDb.prepare(
                `SELECT
                    id,
                    number,
                    type,
                    title,
                    subjects,
                    articles,
                    text
                 FROM laws
                 WHERE id = ?`
            ).get(id);

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            number: row.number,
            type: row.type,
            title: row.title,
            subjects: parseJson(
                row.subjects,
                []
            ),
            articles: parseJson(
                row.articles,
                []
            ),
            text: row.text || ''
        };
    }
);


ipcMain.handle(
    'laws:getLawOfTheDay',
    function () {

        const row =
            runtimeDb.prepare(
                `SELECT
                    id,
                    number,
                    type,
                    title,
                    subjects,
                    articles,
                    text
                 FROM laws
                 WHERE json_array_length(articles) > 0
                 ORDER BY RANDOM()
                 LIMIT 1`
            ).get();

        if (!row) {
            return null;
        }

        return {
            id: row.id,
            number: row.number,
            type: row.type,
            title: row.title,
            subjects: parseJson(
                row.subjects,
                []
            ),
            articles: parseJson(
                row.articles,
                []
            ),
            text: row.text || ''
        };
    }
);


/* =========================================================
   WINDOW
   ========================================================= */

function createWindow() {

    const win =
        new BrowserWindow({
            width: 1200,
            height: 800,
            title: 'My Philippine Laws App',
            icon: path.join(
                __dirname,
                'assets',
                'icon.png'
            ),

            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(
                    __dirname,
                    'preload.js'
                )
            }
        });

    win.loadFile('index.html');
}


/* =========================================================
   APP START
   ========================================================= */

app.whenReady().then(
    function () {

        openRuntimeDatabase();

        Menu.setApplicationMenu(null);

        createWindow();

        app.on(
            'activate',
            function () {

                if (
                    BrowserWindow
                        .getAllWindows()
                        .length === 0
                ) {
                    createWindow();
                }
            }
        );
    }
);


app.on(
    'window-all-closed',
    function () {

        if (
            runtimeDb
        ) {
            try {
                runtimeDb.close();
            } catch (error) {
                console.error(
                    'SQLITE CLOSE ERROR:',
                    error
                );
            }

            runtimeDb = null;
        }

        if (
            process.platform !== 'darwin'
        ) {
            app.quit();
        }
    }
);
