const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('philippineLawsAPI', {
    getCategories: function () {
        return ipcRenderer.invoke('laws:getCategories');
    },

    getLawsByType: function (type) {
        return ipcRenderer.invoke(
            'laws:getLawsByType',
            type
        );
    },

    getLawById: function (id) {
        return ipcRenderer.invoke(
            'laws:getLawById',
            id
        );
    },

    getLawOfTheDay: function () {
        return ipcRenderer.invoke(
            'laws:getLawOfTheDay'
        );
    }
});

console.log(
    'PHILIPPINE LAWS SQLITE BRIDGE READY'
);
