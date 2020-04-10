/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    'N/currentRecord'
], function(
    currentRecord
) {

    var a = 1
    function pageInit(context) {
        console.log(1)
    }

    function saveRecord(context) {
        
    }

    function openchild(){
        /*
 * A窗口的域名是<http://example.com:8080>，以下是A窗口的script标签下的代码：
 */

var popup = window.open('/app/site/hosting/scriptlet.nl?script=757&deploy=1');

// 如果弹出框没有被阻止且加载完成

// 这行语句没有发送信息出去，即使假设当前页面没有改变location（因为targetOrigin设置不对）
popup.postMessage("The user is 'bob' and the password is 'secret'",
                  "*");

// 假设当前页面没有改变location，这条语句会成功添加message到发送队列中去（targetOrigin设置对了）
popup.postMessage("hello there!", "*");

function receiveMessage(event)
{
  // 我们能相信信息的发送者吗?  (也许这个发送者和我们最初打开的不是同一个页面).
  console.log('hello')

  // event.source 是我们通过window.open打开的弹出页面 popup
  // event.data 是 popup发送给当前页面的消息 "hi there yourself!  the secret response is: rheeeeet!"
}
window.addEventListener("message", receiveMessage, false);
        
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        openchild : openchild
    }
});
