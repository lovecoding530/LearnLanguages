async function getJSON(url){
    try {
        let response = await fetch(url);
        let json = await response.json();
        return json;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function getText(url){
    try {
        let response = await fetch(url);
        let json = await response.text();
        return json;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function postJSON(url, json) {
    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        });
        let responseJson = await response.json() ;
        return responseJson;
    } catch (error) {
        console.log("error", error);
    }
}

export {
    getJSON,
    postJSON,
    getText,    
}