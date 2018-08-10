class Store {
    static instance = null;
    static getInstance () {
        if(!Store.instance){
            Store.instance = new Store();
        }
        return Store.instance;
    }

    currentTab = "Browse";
}

let store = new Store();

export default store;