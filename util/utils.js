//utils.js
import extend from "extend";
import platform from "platform";
// import uuidv1 from 'uuid/dist/esm-browser/v1';
import { v1 as uuidv1 } from "uuid";
import Echo from '../util/log';

/**
 * @description: 获取Event 参数
 * @param {*} event
 * @return {*}
 */
const getEvent = (event) => {
  event = event || window.event;
  if (!event) {
    return event;
  }
  if (!event.target) {
    event.target = event.srcElement;
  }
  if (!event.currentTarget) {
    event.currentTarget = event.srcElement;
  }
  return event;
};

/**
 * @description: 获取时间绑定方式（兼容IE 9）
 * @return {*}
 */
const getEventListenerMethod = () => {
  let addMethod = "addEventListener",
    removeMethod = "removeEventListener",
    prefix = "";
  if (!window.addEventListener) {
    addMethod = "attachEvent";
    removeMethod = "detachEvent";
    prefix = "on";
  }
  return {
    addMethod,
    removeMethod,
    prefix,
  };
};

/**
 * @description: 获取元素宽高
 * @param {*} element
 * @return {*}
 */
const getBoundingClientRect = (element) => {
  const rect = element.getBoundingClientRect();
  const width = rect.width || rect.right - rect.left;
  const heigth = rect.heigth || rect.bottom - rect.top;
  return extend({}, rect, {
    width,
    heigth,
  });
};

const stringify = (obj) => {
  let params = [];
  for (let key in obj) {
    params.push(`${key}=${obj[key]}`);
  }
  return params.join("&");
};

/**
 * @description: 获取Dom Path
 * @param {*} element
 * @param {*} useClass
 * @return {*}
 */
const getDomPath = (element, useClass = false) => {
  if (!(element instanceof HTMLElement)) {
    console.warn("input is not a HTML element!");
    return "";
  }
  let domPath = [];
  let elem = element;
  while (elem) {
    let domDesc = getDomDesc(elem, useClass);
    if (!domDesc) {
      break;
    }
    domPath.unshift(domDesc);
    if (
      querySelector(domPath.join(">")) === element ||
      domDesc.indexOf("body") >= 0
    ) {
      break;
    }
    domPath.shift();
    const children = elem.parentNode.children;
    if (children.length > 1) {
      for (let i = 0; i < children.length; i++) {
        if (children[i] === elem) {
          domDesc += `:nth-child(${i + 1})`;
          break;
        }
      }
    }
    domPath.unshift(domDesc);
    if (querySelector(domPath.join(">")) === element) {
      break;
    }
    elem = elem.parentNode;
  }
  return domPath.join(">");
};

const getDomDesc = (element, useClass = false) => {
  const domDesc = [];
  if (!element || !element.tagName) {
    return "";
  }
  if (element.id) {
    return `#${element.id}`;
  }
  domDesc.push(element.tagName.toLowerCase());
  if (useClass) {
    const className = element.className;
    if (className && typeof className === "string") {
      const classes = className.split(/\s+/);
      domDesc.push(`.${classes.join(".")}`);
    }
  }
  if (element.name) {
    domDesc.push(`[name=${element.name}]`);
  }
  return domDesc.join("");
};

const querySelector = function (queryString) {
  return (
    document.getElementById(queryString) ||
    document.getElementsByName(queryString)[0] ||
    document.querySelector(queryString)
  );
};

const getAppInfo = function () {
  let data = {};
  // title
  data.title = document.title;
  // url
  data.url = window.location.href;
  // eventTime
  data.eventTime = new Date().getTime();
  // browserType
  data.browserType = platform.name;
  // browserVersion
  data.browserVersion = platform.version;
  // browserEngine
  data.browserEngine = platform.layout;
  // osType
  data.osType = platform.os.family;
  // osVersion
  data.osVersion = platform.os.version;
  // languages
  data.language = getBrowserLang();
  // referrer
  data.referrer = document.referrer;
  return data;
};

/**
 * @description: 获取页面性能指标
 * @return {*}
 */
const getPerformanceInfo = function () {
  let data = {};
  data.performance = window.performance.timing;
  return data;
};

const getBrowserLang = function () {
  var currentLang = navigator.language;
  if (!currentLang) {
    currentLang = navigator.browserLanguage;
  }
  return currentLang;
};

const createUuid = function () {
  const key = "VLAB_TRACKER_UUID";
  let curUuid = localStorage.getItem(key);
  if (!curUuid) {
    curUuid = uuidv1();
    localStorage.setItem(key, curUuid);
  }
  return curUuid;
};

const reportTracker = function (url, data, header) {
  // const reportData = stringify(data);
  // let urlLength = (url + (url.indexOf("?") < 0 ? "?" : "&") + reportData)
  //   .length;
  // if (urlLength < 2083) {
  //   imgReport(url, data);
  // } else if (navigator.sendBeacon) {
  //   sendBeacon(url, data);
  // } else {
  //   xmlHttpRequest(url, data);
  // }
  xmlHttpRequest(url, data, header);

};

const imgReport = function (url, data) {
  const image = new Image(1, 1);
  image.onload = function () {
    image = null;
  };
  image.src = `${url}?${stringify(data)}`;
};

const sendBeacon = function (url, data) {
  //判断支不支持navigator.sendBeacon
  let headers = {
    type: "application/x-www-form-urlencoded",
  };
  let blob = new Blob([JSON.stringify(data)], headers);
  navigator.sendBeacon(url, blob);
};

const xmlHttpRequest = function (url, data, header) {
  const client = new XMLHttpRequest();
  client.open("POST", url, false);
  client.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  client.setRequestHeader("apikey", header["apikey"]);
  client.send(JSON.stringify(data));
};

const createHistoryEvent = function (type) {
  var origin = history[type];
  return function () {
    var res = origin.apply(this, arguments);
    var e = new Event(type);
    e.arguments = arguments;
    window.dispatchEvent(e);
    return res;
  };
};

const log = function () {
  let echo = Echo();
  echo.group(echo.asWarning("埋点注入成功"));
  echo.log("Make sure the key is correct");
  echo.log("Ensure that data is whitelisted", echo.asAlert("Important!"));
  echo.log("Track");
  echo.log("maintain", echo.asWarning("Strong"));
  echo.groupEnd();
}

export {
  getEvent,
  getEventListenerMethod,
  getBoundingClientRect,
  stringify,
  getDomPath,
  getDomDesc,
  querySelector,
  getAppInfo,
  getPerformanceInfo,
  getBrowserLang,
  createUuid,
  reportTracker,
  createHistoryEvent,
  log
};
