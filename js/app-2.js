// 1 テストのグルーピング
module("backbone.app-2", {
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

test("モデルのRestその２：mockjax", function () {
    //CORSを行うため。これがないと、HTML取得元サーバー以外の通信はエラーとなる。
    jQuery.support.cors = true;

    var MyModel = Backbone.Model.extend({
        urlRoot: '/myModel',
    });

    var myModel = new MyModel({
        id: 1
    });

    //fetchの確認
    $.mockjax({
        url: '/myModel/1',
        type: 'GET',
        responseText: {
            name: "Name",
            value: "Value"
        }
    });

    myModel.fetch({
        async: false
    }).success(function () {
        deepEqual({
                id: 1,
                name: "Name",
                value: "Value"
            }, 　 //オブジェクトの比較にはdeepEqualを使う。
            myModel.attributes,
            JSON.stringify(myModel.attributes));
    });

    // mockjaxのクリア
    $.mockjax.clear();

    myModel.set('name', 'NewName');
    myModel.set('value', 'NewValue');

    //saveの確認
    //IDが設定されている場合はPUT
    //mockjaxのdataはJSON文字列を指定しないとうまくいかなかった・・
    $.mockjax({
        url: '/myModel/1',
        type: 'PUT',
        //        data: {
        //            id: 1,
        //            name: "NewName",
        //            value: "NewValue"
        //        },
        data: JSON.stringify({
            id: 1,
            name: "NewName",
            value: "NewValue"
        }),
        responseText: {
            name: "NewName",
            value: "NewValue",
            version: 1
        }
    });

    stop();
    //wait = trueを指定すると同期で保存。optionは第二引数。第一引数はupdate時に変更する属性。エラーの朝ーとがわからないので、いったんwait=falseとする
    //    myModel.save([],{wait : true}).success(function(){
    myModel.save().success(function () {
        deepEqual({
                id: 1,
                name: "NewName",
                value: "NewValue",
                version: 1
            }, 　 //オブジェクトの比較にはdeepEqualを使う。
            myModel.attributes,
            JSON.stringify(myModel.attributes));

        start();
    }).error(function (a, b, c) {
        ok(false, b + c);
        start();
    });

    //saveの確認
    //IDが設定されていない場合はPOST
    //mockjaxのdataはJSON文字列を指定しないとうまくいかなかった・・
    $.mockjax.clear();
    var myModelPost = new MyModel({
        name: "POSTNAME",
        value: "POSTVALUE"
    });
    $.mockjax({
        url: '/myModel', // /myModel/だとNG
        type: 'POST',
        data: JSON.stringify({
            name: "POSTNAME",
            value: "POSTVALUE"
        }),
        responseText: {
            id: 1,
            name: "POSTNAME",
            value: "POSTVALUE",
            version: 1
        }
    });

    stop();
    myModelPost.save().success(function () {
        deepEqual({
                id: 1,
                name: "POSTNAME",
                value: "POSTVALUE",
                version: 1
            }, //オブジェクトの比較にはdeepEqualを使う。
            myModelPost.attributes,
            JSON.stringify(myModelPost.attributes));
        start();
    }).error(function (a, b, c) {
        ok(false, b + c);
        start();
    });

    //destroyの確認
    //urlとメソッドでわかるので、データは送られない。
    $.mockjax.clear();
    var myModelDelete = new MyModel({
        id: 1,
        name: "DELETENAME",
        value: "DELETEVALUE"
    });
    $.mockjax({
        url: '/myModel/1', // /myModel/だとNG
        type: 'DELETE',
        data: "",
        responseText: {
            id: 1,
            name: "DELETENAME",
            value: "DELETEVALUE",
            version: 1
        }
    });

    stop();
    //destroyにはオプション指定がない模様。
    myModelDelete.destroy({
        success: function () {
            ok(_.isEmpty(myModelDelete.changed)); //delete時、属性に応答は反映されない。ステータスコードか？
            start();
        },
        error: function (a, b, c) {
            ok(false, JSON.stringify(a) + JSON.stringify(b) + JSON.stringify(c));
            start();
        }
    });

    //validation errorの場合、saveを呼ぶとサーバー通信されないことを確認。
    var ValidateMyModel = MyModel.extend({
        //    var ValidateMyModel = Backbone.Model.extend({
        validate: function (attrs) {
            if (attrs.name == null || attrs.name == undefined) {
                return "data is required."
            }
        }
    });

    $.mockjax({
        url: '/myModel/1', // /myModel/だとNG,
        responseText: {
            id: 1,
            name: "DELETENAME",
            value: "DELETEVALUE",
            version: 1
        }

    });

    var validateMyModel = new ValidateMyModel({
        id: 1,
        name: null,
        value: "VALUE"
    });
    //    stop();
    var result = validateMyModel.save(
        [], {
            async: false,
            success: function () {
                ok(false, "バリデーションエラーになりません");
                //start();
            },
            error: function (a, b, c) {
                ok(false, "バリデーションエラーになりません");
                //start();
            }
        }
    );
    //saveの戻り値は、バリデーションエラー時false、成功時xhrオブジェクト
    equal(false, result);
    equal("data is required.", validateMyModel.validationError);

});

test("モデルのイベント監視", function () {
    var EventModel = Backbone.Model.extend({
        validate: function (data) {
            var errors = {};
            if (data.name == undefined || data.name == null) {
                errors.name = "name is required.";
            }
            if (!_.size(errors) == 0) return errors;
        }
    });

    var eventModel = new EventModel({
        name: "NAME",
        value: "VALUE"
    });

    var triggered = null;

    //myEventを監視する。
    eventModel.on('myEvent', function (arg) {
        //イベントハンドラの引数は、イベント発火時の引数。
        equal(arg, "aaa")
        triggered = true;
    });

    //イベントを発火する
    eventModel.trigger("myEvent", "aaa");
    ok(triggered);

    //イベント監視用ハンドラを除外する。
    eventModel.off("myEvent");
    triggered = null;
    eventModel.trigger("myEvent", "aaa");
    ok(!triggered);

    //組み込みイベントを試してみる。仕様は以下を参照。
    //http://backbonejs.org/#Events-catalog
    //以下のようにオブジェクトを使用して、複数イベントを設定できる。
    eventModel.on({
        "change:value": function (model, option) {
            ok(model instanceof EventModel);
            deepEqual({
                name: "NAME",
                value: "CHANGED"
            }, model.attributes);
            //変更されたプロパティだけとることもできる
            deepEqual({
                value: "CHANGED"
            }, model.changed);
        },
        "invalid": function (model, error, option) {
            ok(model instanceof EventModel);
            deepEqual(model.attributes, {
                name: null,
                value: "CHANGED"
            });
            deepEqual(error, {
                name: "name is required."
            })
        }
    });

    eventModel.set("value", "CHANGED"); // change:valueイベントが発生する。
    eventModel.set("name", null);
    eventModel.isValid();　　　　　　　　　 // invalidイベントが発生する。

    //1回だけ呼び出されるイベントハンドラを設定する・
    //すべてオフにする場合。
    eventModel.off();

    var calltime = 0;
    eventModel.once("change", function (model, option) {
        deepEqual({
            name: "CHANGED",
            value: "CHANGED"
        }, model.attributes);
        calltime++;
    });

    eventModel.set("name", "CHANGED");
    eventModel.set("name", "CHANGED");
    eventModel.set("name", "CHANGED");

    //1回しか呼び出されないこと
    equal(calltime, 1);

    //context
    //イベントハンドラ設定時にcontextを指定すると、イベントハンドラ内のthisを指定できる。
    //指定しない場合、thisはイベントハンドラを紐付けたオブジェクトになる。
    eventModel.off();
    var context = {
        attr: 1
    };
    eventModel.on("change", function (model, option) {
        deepEqual({
            name: "aaa",
            value: "CHANGED"
        }, model.attributes);
        //        alert(JSON.stringify(this)); // contextを指定しない場合はこっちになる。
        equal(this, context)
    }, context);

    eventModel.set("name", "aaa");
});

test("モデルのイベント監視(listenTo)", function () {
    //listenTo
    //モデルを監視するリスナを、監視対象のモデル以外に設定できる。たとえば、Viewに設定できる。
    //以下ではクライアント・メモリリークを防ぐ手段として用いると、記載がある。
    //http://d.hatena.ne.jp/koba04/20140126/1390719683

    //ということで用途としてはViewからModelの変更を参照することのように見えるので、簡単なのつくって検証。
    var MyView = Backbone.View.extend({
        el: "#custom-fixture",

        initialize: function () {
            this.render();
            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {
            this.$el.text(this.model.get('name'));
            return this;
        }
    });

    var MyModel = Backbone.Model.extend();
    var model = new MyModel({
        name: "NAME"
    });

    //view
    var myView = new MyView({
        model: model
    });

    //初期表示
    equal($('#custom-fixture').text(), "NAME")

    //モデルを変更。listenToが発火⇒renderが呼び出される⇒変更した値に書き換わることを確認。
    model.set("name", "changed");
    equal($('#custom-fixture').text(), "changed")

    //リスナを削除する。
    myView.stopListening(model);
    //リスナが削除されたので、リスナが発火することはない。
    model.set("name", "CHANGED");
    equal($('#custom-fixture').text(), "changed")

    //コールバックが1回だけ行われるようにする
    myView.listenToOnce(model, 'change', myView.render);
    model.set("name", "CHANGED1");
    model.set("name", "CHANGED2");
    model.set("name", "CHANGED3");
    equal($('#custom-fixture').text(), "CHANGED1")

});

test("コレクションの基本", function () {
    //コレクションに設定するモデルクラスの定義。
    var MyModel = Backbone.Model.extend({
        defaults: {
            name: 'anonimous'
        },
        hello: function () {
            return 'hello! my name is ' + this.get('name');
        }
    });

    var MyModelCollection = Backbone.Collection.extend({
        //コレクションに設定するモデルクラスを指定。
        model: MyModel
    });

    var myModelCollection = new MyModelCollection(
        //コレクション生成時、コンストラクタでエンティティを設定。（その際、明示的にエンティティをnewする必要はない）
        [
            {
                name: 'taro'
            },
            {},
            {
                name: 'hanako'
            }
        ]
    );
    //オブジェクト式({})でなく、明示的にモデルのインスタンスを設定することもできる。その際、modelとの型一致チェックは行われない。
    //そのため、以下のコードを実行すると、eachで例外(helloがない)が発生する
    //myModelCollection.add(new Backbone.Model({}));

    //オブジェクトのイテレーション(underscore.jsのメソッド。)
    myModelCollection.forEach(function (element) {
        ok(true, element.hello());
    });

    //要素の追加
    myModelCollection.add({
        name: 'hasegawa'
    });
    equal(_.size(myModelCollection), 4);
    equal(myModelCollection.size(), 4);

    //要素を複数追加
    myModelCollection.add([
        {
            name: 'iizuka'
        },
        {
            name: 'taro'
        }
    ])
    equal(myModelCollection.size(), 6);

    //index操作
    //インデックスを指定した追加
    myModelCollection.add({
            name: 'index::2'
        }, {
            at: 2
        } //わかりづら・・
    );

    //インデックスを指定した取得
    var myModelIndex2 = myModelCollection.at(2);
    deepEqual(myModelIndex2.attributes, {
        name: 'index::2'
    });
    equal(myModelCollection.size(), 7);

    //検索。属性が指定した値のオブジェクトの配列を取得。コレクションではなく配列が戻ってくるらしい
    var find = myModelCollection.where({
        name: 'index::2'
    });
    equal(true, find instanceof Array);
    equal(1, find.length);
    deepEqual(find[0].attributes, {
        name: 'index::2'
    });

    //要素を指定した削除
    myModelCollection.remove(myModelIndex2)
    equal(myModelCollection.size(), 6);

    //削除されていることの確認
    find = myModelCollection.where({
        name: 'index::2'
    });
    equal(find.length, 0);

    //要素の入れ替え
    myModelCollection.reset([
        {
            name: 'foo'
        },
        {
            name: 'bar'
        },
        {
            name: 'baz'
        },
    ]);
    equal(myModelCollection.size(), 3);
    deepEqual(myModelCollection.at(0).attributes, {
        name: 'foo'
    });
    deepEqual(myModelCollection.at(1).attributes, {
        name: 'bar'
    });
    deepEqual(myModelCollection.at(2).attributes, {
        name: 'baz'
    });

    //要素のクリア
    myModelCollection.reset();
    equal(myModelCollection.size(), 0);

    //要素のソート
    var SortedMyCollection = Backbone.Collection.extend({
        comparator: 'age', //属性名だけ指定したソート。
        model: MyModel
    });
    var sortedMyCollection = new SortedMyCollection(
        [
            {
                name: 'eiji',
                age: 40
            },
            {
                name: 'takao',
                age: 30
            },
            {
                age: 10
            },
        ]
    );

    //    sortedMyCollection.sort();
    //comparatorを指定しておくと、コレクション操作時指定の順番にソートされる。
    deepEqual(sortedMyCollection.at(0).attributes, {
        name: 'anonimous',
        age: 10
    });
    deepEqual(sortedMyCollection.at(1).attributes, {
        name: 'takao',
        age: 30
    });
    deepEqual(sortedMyCollection.at(2).attributes, {
        name: 'eiji',
        age: 40
    });

    //ソートロジックを組む
    sortedMyCollection.comparator = function (left, right) {
        return left.get('name').length - right.get('name').length;
    };

    //sort:falseでコレクション追加したときは、ソートされない。
    sortedMyCollection.add({
        name: 'abcdef',
        age: 100
    }, {
        sort: false
    });
    deepEqual(sortedMyCollection.at(0).attributes, {
        name: 'anonimous',
        age: 10
    });
    deepEqual(sortedMyCollection.at(1).attributes, {
        name: 'takao',
        age: 30
    });
    deepEqual(sortedMyCollection.at(2).attributes, {
        name: 'eiji',
        age: 40
    });
    deepEqual(sortedMyCollection.at(3).attributes, {
        name: 'abcdef',
        age: 100
    });

    //sortを呼ぶと、Collection#comparatorによりソートされる。
    sortedMyCollection.sort();
    deepEqual(sortedMyCollection.at(0).attributes, {
        name: 'eiji',
        age: 40
    });
    deepEqual(sortedMyCollection.at(1).attributes, {
        name: 'takao',
        age: 30
    });
    deepEqual(sortedMyCollection.at(2).attributes, {
        name: 'abcdef',
        age: 100
    });
    deepEqual(sortedMyCollection.at(3).attributes, {
        name: 'anonimous',
        age: 10
    });

    //pluck コレクションから特定の属性だけ抜き出したリストを作る
    var plucked = sortedMyCollection.pluck('age');
    //配列の比較もdeepEqual.
    deepEqual(plucked, [40, 30, 100, 10]);

    //filter whereはサンプルで検索するが、関数で検索することもできる。（underscoreのメソッド）
    var filtered = sortedMyCollection.filter(function (obj) {
        return obj.get('name').length % 2 == 0;
    });
    equal(filtered.length, 2)
    deepEqual(filtered[0].attributes, {
        name: 'eiji',
        age: 40
    });
    deepEqual(filtered[1].attributes, {
        name: 'abcdef',
        age: 100
    });

    //slice
    var silecd = sortedMyCollection.slice(1, 3); //index1 以上　3未満を取得。
    equal(silecd.length, 2)
    deepEqual(silecd[0].attributes, {
        name: 'takao',
        age: 30
    });
    deepEqual(silecd[1].attributes, {
        name: 'abcdef',
        age: 100
    });

    //idで取得
    myModelCollection = new MyModelCollection();
    myModelCollection.add([
        {
            id: 'A',
            name: "name1"
        },
        {
            id: 'B',
            name: "name2"
        },
        {
            id: 'C',
            name: "name3"
        }
    ]);
    deepEqual(myModelCollection.get('A').attributes, {
        id: 'A',
        name: "name1"
    });
    deepEqual(myModelCollection.get('B').attributes, {
        id: 'B',
        name: "name2"
    });
    deepEqual(myModelCollection.get('C').attributes, {
        id: 'C',
        name: "name3"
    });

});

//create以外、コレクション追加時にバリデーションはされないらしい・・・。
//test("コレクション：validation", function () {
//
//    var ValidationModel = Backbone.Model.extend({
//        validate : function(data){
//            alert(data);
//            if(!data.name){
//                return "error";
//            }
//        }
//    });
//
//    var ValidateCollection = Backbone.Collection.extend(
//        {
//            model : ValidationModel
//        }
//    );
//
//    var validateCollection = new ValidateCollection();
//    validateCollection.on('add',function(data){
//        alert(data)
//    });
//    
//    new ValidationModel({}).isValid();
//    
//    validateCollection.add({});
//    equal(1,validateCollection.size());
//});

test("コレクションのREST対応", function () {
    var MyEntity = Backbone.Model.extend({});

    var MyCollection = Backbone.Collection.extend({
        model: MyEntity,
        url: '/myCollection'
    });

    var myCollection = new MyCollection();

    //1.fetch
    $.mockjax({
        url: '/myCollection',
        type: 'GET',
        responseText: [
            {
                id: 1,
                name: 'name1'
            },
            {
                id: 2,
                name: 'name2'
            },
            {
                id: 3,
                name: 'name3'
            },
        ]
    });
    myCollection.fetch({
        async: false,
        success: function (collection, response, options) {
            equal(collection.size(), 3);
            ok(collection.at(0).matches({
                id: 1
            }));
            ok(collection.at(1).matches({
                id: 2
            }));
            ok(collection.at(2).matches({
                id: 3
            }));
        },
        error: function (collection, response, options) {
            ok(false);
        }
    });

    //fetchのカスタマイズいろいろできるがとりあえず、パラメータ付与
    $.mockjax.clear();
    $.mockjax({
        url: '/myCollection',
        type: 'GET',
        data: {
            page: 3,
            name: 'NAME'
        },
        //        data: JSON.stringify({ //GETの場合、striingifyすると駄目・・・なぜ？
        //            page: 3
        //        }),
        responseText: [
            {
                id: 1,
                name: 'name1'
            },
            {
                id: 2,
                name: 'name2'
            },
            {
                id: 3,
                name: 'name3'
            },
        ]
    });

    myCollection.fetch({
        async: false,
        data: {
            page: 3,
            name: 'NAME'
        },
        success: function (collection, response, options) {
            equal(collection.size(), 3);
            ok(collection.at(0).matches({
                id: 1
            }));
            ok(collection.at(1).matches({
                id: 2
            }));
            ok(collection.at(2).matches({
                id: 3
            }));
        },
        error: function (collection, response, options) {
            ok(false);
        }
    });

    //コレクションに追加しつつ、サーバーにPUT
    $.mockjax.clear();
    $.mockjax({
        url: '/myCollection',
        type: 'POST',
        data: JSON.stringify({
            name: 'nameX'
        }),
        responseText: {
            id: 4,
            name: 'nameX'
        }
    });

    myCollection.create({
        name: "nameX"
    }, {
        async: false,
        //イベントハンドラには登録されえたオブジェクトが戻ってくる。
        //オブジェクトの属性は、サーバー側の戻り値のjsonが追加されるイメージっぽい。
        success: function (object, response, options) {
            deepEqual(object.attributes, {
                id: 4,
                name: 'nameX'
            });
        },
        error: function (object, response, options) {
            ok(false);
        }
    });

    equal(myCollection.size(), 4);
    deepEqual(myCollection.at(0).attributes, {
        id: 1,
        name: 'name1'
    });
    deepEqual(myCollection.at(1).attributes, {
        id: 2,
        name: 'name2'
    });
    deepEqual(myCollection.at(2).attributes, {
        id: 3,
        name: 'name3'
    });
    deepEqual(myCollection.at(3).attributes, {
        id: 4,
        name: 'nameX'
    });

});