// 1 テストのグルーピング
module("backbone.router-test", {
    // 2 セットアップ
    beforeEach: function () {
        'use strict';
        // Loggerのwrite処理を起きかえ
        testutils.logger.write = function (message) {
            $('#log-message-ol').append('<li>' + message + '</li>');
        };
        // Logger出力エリアは、必要ならクリアできる
        $('#log-message-ol').empty();

    },
    afterEach: function () {
        'use strict';
        // #custom-fixtureのリストア処理
        testutils.htmlfixture.teardownFixture();

        // mockjaxのクリア
        $.mockjax.clear();
    }
});

test('routerのテスト', function () {

    var onTopCalled = false;
    var pathParamCalledParam = null;

    //        //#onTopにURLが変わったら、関数を呼ぶ
    //        // #pathParam/id に変わったら、idを引数に関数を呼ぶ
    var MyRouter = Backbone.Router.extend({
        routes: {
            "top": "onTop"
        },
        onTop: function () {
            onTopCalled = true;
        }
    });
    //    //Routerのインスタンスを生成後、Backbone.history.start()でURLを監視。
    var myRouter = new MyRouter();
    Backbone.history.start();
    //
    //    //uRLが外部で変更されると、ルータにより検知されコールバックされる。
    location.href = '#/top';
    stop();
    //    setTimeout(1000, function () {
    //        ok(onTopCalled);
    //    });

    //    location.href = '#/pathParam/A';
    //    equal(pathParamCalledParam, 'A');
});