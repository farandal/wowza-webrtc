/*
 * This code and all components (c) Copyright 2019-2020, Wowza Media Systems, LLC. All rights reserved.
 * This code is licensed pursuant to the BSD 3-Clause License.
 */

import * as Cookies from 'js-cookie';

const cookieName = 'WowzaWebtcValues';

const saveToCookie = (valuesObject:any) => {
  let cookieValue = Cookies.get(cookieName);
  if (cookieValue == null) cookieValue = '{}';
  let cookieObject = JSON.parse(unescape(cookieValue));
  let saveObject = {...cookieObject,...valuesObject};
  Cookies.set(cookieName,escape(JSON.stringify(saveObject)));
}

const mapFromCookie = (initialStateObject:any) => {
  let state = {...initialStateObject};
  let cookieValue = Cookies.get(cookieName);
  if (cookieValue == null) cookieValue = '{}';
  let cookieObject = JSON.parse(unescape(cookieValue));
  for (let key in cookieObject) {
    if (state[key] != null)
      state[key] = cookieObject[key];
  };
  return state;
}

const mapFromQueryParams = (initialStateObject:any) => {
  let state = {...initialStateObject};
  for (let [key, value] of Object.entries(initialStateObject)) {
    state[key] = getQueryVariable(key,state[key]);
  }
  return state;
}

const mapFromForm = (formValueArray:any) => {
  let state = {};
  for(var i = 0; i < formValueArray.length; i++){
    state[formValueArray[i].name] = formValueArray[i].value;
  }
  return state;
}

const updateForm = (state:any) => {
  for (let [key, value] of Object.entries(state)) {
    // TODO! Replace all Jquery implementations
    //$(`#${key}`).val(state[key]);
  
  }
}

const getQueryVariable = (variable:any,defaultVal:any) => {
   var query = window.location.search.substring(1);
   var vars = query.split('&');
   for (var i = 0; i < vars.length; i++)
   {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable)
      {
         return decodeURIComponent(pair[1]);
      }
   }
   return defaultVal;
}

const shareLink = (settings:any,message:any) => {
  // TODO! Replace all Jquery implementations
  //let queryParams = $.param(settings);
  let queryParams = "";
  
  let baseUrl:string = window.location.href.split('#')[0];
  let anchor = baseUrl[1] ? '#'+baseUrl[1] : '';
  baseUrl = baseUrl[0].split('?')[0]; //toss existing query params
  copyTextToClipboard(baseUrl+'?'+queryParams+anchor,message);
}

const copyTextToClipboard = (text:any,message:any) => {
  if(text === null || text === undefined || text.length == 0){
    alert("Copy failed :(")
    return
  }

  navigator.clipboard.writeText(text).then(() => {
    showAlert()
  }, () => {
    /* clipboard write failed do it the ugly way */
    text.select();
    document.execCommand("copy");
    showAlert();
  });

  const showAlert = () => {
    if(message){
      alert(message);
    }else{
      alert("Copied!")
    }
  }
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
