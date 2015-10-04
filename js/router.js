//doucment読み込み後に実行しないと、HTMLが未評価のためELが正しく評価できない。
$(document).ready(function () {
    //$(function () {
    var MyRouter = Backbone.Router.extend({
        //パスに対して呼び出される関数を登録。
        routes: {
            '': 'start', //初期ルート
            'top': 'onTop', //#/top時、onTopが呼ばれる
            'pathParam/:id': 'pathParam', //#/pathParam / 111 時、 pathParam(111) が呼ばれる
            '*default': 'handleDefault' //初期ルート
        },
        start: function () {
            alert('start');
        },
        onTop: function () {
            alert('onTop');
        },
        pathParam: function (id) {
            alert(id);
        },
        handleDefault: function (id) {
            alert('handleDefault');
        }
    });

    var MyView = Backbone.View.extend({
        el: '#form',
        events: {
            'click #href': 'href',
            'click #hrefWithPath': 'hrefWithPath',
            'click #changeurl_nohistory': 'changeurlNoHistory',
            'click #changeurl_history': 'changeurlHistory',
            'click #other': 'other',
        },
        href: function (e) {
            e.preventDefault();
            location.href = '#/top';
        },
        hrefWithPath: function (e) {
            e.preventDefault();
            location.href = '#/pathParam/111';
        },
        changeurlHistory: function (e) {
            e.preventDefault();
            myRouter.navigate('pathParam/333'); //pathは #/onTopになるが、routesに登録した関数はトリガーされない。
        },
        changeurlNoHistory: function (e) {
            e.preventDefault();
            myRouter.navigate('pathParam/222', {
                trigger: true, //こうするとトリガー発火できる。
                replace: true　 //こうすると、navigateで書き換えたURLをブラウザの履歴に残さなくて住む・・らしいが、履歴に残るよ？
            });
        },
        other: function (e) {
            e.preventDefault();
            location.href = '#/other';
        },
    })

    var myView = new MyView();

    //Rounterのインスタンスを生成し、Backbone.history.start()を呼び出すとパスの監視が始まる。
    var myRouter = new MyRouter();
    Backbone.history.start();

    //ハッシュフラグメントを使用しない場合は、こちら。
    //    Backbone.history.start({
    //        pushState: true
    //    });

});