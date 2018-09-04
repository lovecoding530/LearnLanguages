class Store {
    static instance = null;
    static getInstance () {
        if(!Store.instance){
            Store.instance = new Store();
        }
        return Store.instance;
    }

    sharedVideoId = "";
    navigator = null;
}

let store = new Store();

export default store;