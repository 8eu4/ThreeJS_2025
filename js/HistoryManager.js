// js/HistoryManager.js

export class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.limit = 100; // Batas jumlah undo
    }

    /**
     * Menjalankan perintah baru dan menambahkannya ke tumpukan undo.
     * @param {object} command - Objek perintah yang memiliki { execute, undo }
     */
    execute(command) {
        // Hapus tumpukan redo karena kita memulai "timeline" baru
        this.redoStack = [];
        
        // Jalankan perintah
        command.execute();
        
        // Tambahkan ke tumpukan undo
        this.undoStack.push(command);

        // Jaga agar tumpukan tidak terlalu besar
        if (this.undoStack.length > this.limit) {
            this.undoStack.shift();
        }
    }

    /**
     * Membatalkan perintah terakhir.
     */
    undo() {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        } else {
            console.log("History: Nothing to undo.");
        }
    }

    /**
     * Mengulang perintah yang dibatalkan.
     */
    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        } else {
            console.log("History: Nothing to redo.");
        }
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
    }
}