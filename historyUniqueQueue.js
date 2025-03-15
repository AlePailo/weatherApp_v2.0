export default class Max5ElementsUniqueQueue {
    constructor() {
        this.items = []
    }

    enqueue(newItem) {
        const pos = this.items.findIndex(item => item.id === newItem.id)
        if(pos !== -1) {
            this.items.splice(pos, 1)
        }
        if(this.items.length === 5) {
            this.dequeue()
        }
        this.items.push(newItem);
        this.saveToLocalStorage()
    }

    dequeue() {
        if (!this.isEmpty()) this.items.shift()
    }

    leaveQueue(itemId) {
        const pos = this.items.findIndex(item => item.id === itemId)
        if(pos !== -1) this.items.splice(pos, 1)
    }

    size() {
        return this.items.length
    }

    isEmpty() {
        return this.items.length === 0
    }

    getHistory() {
        return [...this.items].reverse()
    }

    saveToLocalStorage() {
        localStorage.setItem("lastSearches", JSON.stringify(this.items))
    }

    static loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem("lastSearches")) || []
        const instance = new Max5ElementsUniqueQueue()
        instance.items = data
        return instance
    }
}