/*jslint skip_file:true*/
var hola_versions = {"windows":"1.11.723","windows_5_percent":"1.11.723","opera":"1.11.728","chromium":"1.10.553","chrome":"1.11.728","chrome_dll":"1.7.333","torch_dll":"1.11.728","firefox":"1.10.574","firefox_signed":"1.8.816","firefox_signed0":"1.11.576","android":"1.11.14","android_5_percent":"1.11.766","ios":"1.6","chromium_br":"44.0.2403.157.7","web_installer":"1.0.5884.38143"};

if (typeof define=='function')
    define('/svc/versions.js', hola_versions);
else
    module.exports = hola_versions;
