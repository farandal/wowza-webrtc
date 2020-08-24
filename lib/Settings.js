import * as Cookies from 'js-cookie';
const cookieName = 'WowzaWebtcValues';
const saveToCookie = (valuesObject) => {
    let cookieValue = Cookies.get(cookieName);
    if (cookieValue == null)
        cookieValue = '{}';
    let cookieObject = JSON.parse(unescape(cookieValue));
    let saveObject = Object.assign(Object.assign({}, cookieObject), valuesObject);
    Cookies.set(cookieName, escape(JSON.stringify(saveObject)));
};
const mapFromCookie = (initialStateObject) => {
    let state = Object.assign({}, initialStateObject);
    let cookieValue = Cookies.get(cookieName);
    if (cookieValue == null)
        cookieValue = '{}';
    let cookieObject = JSON.parse(unescape(cookieValue));
    for (let key in cookieObject) {
        if (state[key] != null)
            state[key] = cookieObject[key];
    }
    ;
    return state;
};
const mapFromQueryParams = (initialStateObject) => {
    let state = Object.assign({}, initialStateObject);
    for (let [key, value] of Object.entries(initialStateObject)) {
        state[key] = getQueryVariable(key, state[key]);
    }
    return state;
};
const mapFromForm = (formValueArray) => {
    let state = {};
    for (var i = 0; i < formValueArray.length; i++) {
        state[formValueArray[i].name] = formValueArray[i].value;
    }
    return state;
};
const updateForm = (state) => {
    for (let [key, value] of Object.entries(state)) {
    }
};
const getQueryVariable = (variable, defaultVal) => {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return defaultVal;
};
const shareLink = (settings, message) => {
    let queryParams = "";
    let baseUrl = window.location.href.split('#')[0];
    let anchor = baseUrl[1] ? '#' + baseUrl[1] : '';
    baseUrl = baseUrl[0].split('?')[0];
    copyTextToClipboard(baseUrl + '?' + queryParams + anchor, message);
};
const copyTextToClipboard = (text, message) => {
    if (text === null || text === undefined || text.length == 0) {
        alert("Copy failed :(");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showAlert();
    }, () => {
        text.select();
        document.execCommand("copy");
        showAlert();
    });
    const showAlert = () => {
        if (message) {
            alert(message);
        }
        else {
            alert("Copied!");
        }
    };
};
let Settings = {
    saveToCookie: saveToCookie,
    mapFromCookie: mapFromCookie,
    mapFromQueryParams: mapFromQueryParams,
    mapFromForm: mapFromForm,
    updateForm: updateForm,
    getQueryVariable: getQueryVariable,
    shareLink: shareLink
};
export default Settings;
//# sourceMappingURL=Settings.js.map