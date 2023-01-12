// tracker.js
import extend from 'extend';
import {
    getEvent,
    getEventListenerMethod,
    getBoundingClientRect,
    getDomPath,
    getAppInfo,
    getPerformanceInfo,
    createUuid,
    reportTracker,
    createHistoryEvent,
    log
} from '../util/utils';

const defaultOptions = {
    useClass: false, // 是否用当前dom元素中的类名标识当前元素
    appid: 'default', // 应用标识，用来区分埋点数据中的应用
    uuid: '', // 设备标识，自动生成并存在浏览器中,
    userInfo: {},
    extra: {}, // 用户自定义上传字段对象
    enableTrackerKey: false, // 是否开启约定拥有属性值为'tracker-key'的dom的点击事件自动上报
    enableHeatMapTracker: false, // 是否开启热力图自动上报
    enableLoadTracker: false, // 是否开启页面加载自动上报，适合多页面应用的pv上报
    enableHistoryTracker: false, // 是否开启页面history变化自动上报，适合单页面应用的history路由
    enableHashTracker: false, // 是否开启页面hash变化自动上报，适合单页面应用的hash路由
    enableClosedTracker: false, // 是否开启页面关闭自动上报
    apikey: '',
    requestUrl: 'http://localhost:3000', // 埋点请求后端接口
    reportWhiteList: [], // 数据上报白名单
};

const MouseEventList = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseup', 'mouseenter', 'mouseout', 'mouseover'];

const browserHistoryEvent = ['popstate', 'pushState', 'replaceState', 'hashchange', 'beforeunload']


class Tracker {
    constructor(options) {
        this._isInstall = false;
        this._options = {};
        this.timeStr = null;
        this.reportWhiteListVaild(options) && this._init(options)
    }

    /**
     * @description: 初始化白名单验证
     * @return {*}
     */
    reportWhiteListVaild(options) {
        if (window.location) {
            let { hostname } = window.location;
            return options.reportWhiteList.includes(hostname);
        } else {
            return false;
        }
    }

    /**
     * 初始化
     * @param {*} options 用户参数
     */
    _init(options = {}) {
        this._setConfig(options);
        this._setUuid();
        this._installInnerTrack();
        log();
    }

    /**
     * 用户参数合并
     * @param {*} options 用户参数
     */
    _setConfig(options) {
        options = extend(true, {}, defaultOptions, options);
        this._options = options;
    }

    /**
     * 设置当前设备uuid标识
     */
    _setUuid() {
        const uuid = createUuid();
        this._options.uuid = uuid;
    }

    /**
     * 设置当前用户标识
     * @param {*} userId 用户标识
     */
    setUserId(userId) {
        this._options.userId = userId;
    }

    /**
     * @description: 设置埋点上报userInfo
     * @param {*} userInfo
     * @return {*}
     */
    setUserInfo(userInfo) {
        this._options.userInfo = userInfo;
    }

    /**
     * 设置埋点上报额外数据
     * @param {*} extraObj 需要加到埋点上报中的额外数据
     */
    setExtra(extraObj) {
        this._options.extra = extraObj;
    }

    /**
     * 约定拥有属性值为'tracker-key'的dom点击事件上报函数
     */
    _trackerKeyReport() {
        const that = this;
        const eventMethodObj = getEventListenerMethod();
        const eventName = 'click'
        window[eventMethodObj.addMethod](eventMethodObj.prefix + eventName, function (event) {
            const eventFix = getEvent(event);
            const trackerValue = eventFix.target.getAttribute('tracker-key');
            if (trackerValue) {
                that.sendTracker('click', trackerValue, {});
            }
        }, false)
    }

    /**
     * 通用事件处理函数
     * @param {*} eventList 事件类型数组
     * @param {*} trackKey 埋点key
     */
    _captureEvents(eventList, trackKey) {
        const that = this;
        const eventMethodObj = getEventListenerMethod();
        for (let i = 0, j = eventList.length; i < j; i++) {
            let eventName = eventList[i];
            window[eventMethodObj.addMethod](eventMethodObj.prefix + eventName, function (event) {
                const eventFix = getEvent(event);
                if (!eventFix) {
                    return;
                }
                // 计算页面进入时间
                if(eventName === 'load') {
                    that.timeStr = new Date().getTime();
                }
                if (MouseEventList.indexOf(eventName) > -1) {
                    const domData = that._getDomAndOffset(eventFix);
                    that.sendTracker(eventFix.type, trackKey, domData);
                } else if (browserHistoryEvent.indexOf(eventName) > -1) {
                    const timeData = that._getInOutTimePage();
                    let pageStatus = {
                        tag: eventName === 'beforeunload' ? 0 : 1
                    };
                    that.sendTracker(eventFix.type, trackKey, { ...timeData, ...pageStatus });
                    this.timeStr = new Date().getTime();
                } else {
                    that.sendTracker(eventFix.type, trackKey, {});
                }
            }, false)
        }
    }

    /**
     * 获取触发事件的dom元素和位置信息
     * @param {*} event 事件类型
     * @returns 
     */
    _getDomAndOffset(event) {
        const domPath = getDomPath(event.target, this._options.useClass);
        const rect = getBoundingClientRect(event.target);
        if (rect.width == 0 || rect.height == 0) {
            return;
        }
        let t = document.documentElement || document.body.parentNode;
        const scrollX = (t && typeof t.scrollLeft == 'number' ? t : document.body).scrollLeft;
        const scrollY = (t && typeof t.scrollTop == 'number' ? t : document.body).scrollTop;
        const pageX = event.pageX || event.clientX + scrollX;
        const pageY = event.pageY || event.clientY + scrollY;
        const data = {
            domPath: encodeURIComponent(domPath),
            offsetX: ((pageX - rect.left - scrollX) / rect.width).toFixed(6),
            offsetY: ((pageY - rect.top - scrollY) / rect.height).toFixed(6),
        };
        return data;
    }

    /**
     * @description: 获取单页面应用页面切换进出页面时间
     * @return {*}
     */
    _getInOutTimePage() {
        const data = {
            pageInTime: this.timeStr,
            pageOutTime: new Date().getTime()
        };
        return data;
    }

    /**
     * 埋点上报
     * @param {*} eventType 事件类型
     * @param {*} eventId  事件key
     * @param {*} data 埋点数据
     */
    sendTracker(eventType, eventId, data = {}) {
        const defaultData = {
            userId: this._options.userId,
            appid: this._options.appid,
            uuid: this._options.uuid,
            userInfo: this._options.userInfo,
            eventType: eventType,
            eventId: eventId,
            ...getPerformanceInfo(),
            ...getAppInfo(),
            ...this._options.extra,
        };
        const { apikey, requestUrl } = this._options
        const sendData = extend(true, {}, defaultData, data);
        reportTracker(requestUrl, sendData, { apikey: apikey });
    }

    /**
     * 装载sdk内部自动埋点
     * @returns 
     */
    _installInnerTrack() {
        if (this._isInstall) {
            return this;
        }
        if (this._options.enableTrackerKey) {
            this._trackerKeyReport();
        }
        // 热力图埋点
        if (this._options.enableHeatMapTracker) {
            this._openInnerTrack(['click'], 'innerHeatMap');
        }
        // 页面load埋点
        if (this._options.enableLoadTracker) {
            this._openInnerTrack(['load'], 'innerPageLoad');
        }
        // 页面history变化埋点
        if (this._options.enableHistoryTracker) {
            // 首先监听页面第一次加载的load事件
            this._openInnerTrack(['load'], 'innerPageLoad');
            // 对浏览器history对象对方法进行改写，实现对单页面应用history路由变化的监听
            history['pushState'] = createHistoryEvent('pushState');
            history['replaceState'] = createHistoryEvent('replaceState');
            this._openInnerTrack(['pushState'], 'innerHistoryChange');
            this._openInnerTrack(['replaceState'], 'innerHistoryChange');
        }
        if (this._options.enableClosedTracker) {
            this._openInnerTrack(['beforeunload'], 'innerClosedPage');
        }
        // todo
        // 页面hash变化埋点
        if (this._options.enableHashTracker) {
            // 首先监听页面第一次加载的load事件
            this._openInnerTrack(['load'], 'innerPageLoad');
            // 同时监听hashchange事件
            this._openInnerTrack(['hashchange'], 'innerHashChange');
        }

        this._isInstall = true;
        return this;
    }

    /**
     * 开启内部埋点
     * @param {*} event 监听事件类型
     * @param {*} trackKey 埋点key
     * @returns 
     */
    _openInnerTrack(event, trackKey) {
        return this._captureEvents(event, trackKey);
    }

}

export default Tracker;