// 1 テストのグルーピング
module("backbone.basic", {
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

test("モデルのテスト", function () {
    'use strict';
    // model
    // Backbone.Model.extendの戻り値はコンストラクタ関数
    var MyModel = Backbone.Model.extend(
        //第一引数：コンストラクタ、インスタンスメソッド、インスタンス属性のデフォルト値の定義
        {
            //コンストラクタ
            constructor: function () {
                //コンストラクタを定義する場合は、必ず呼ばないといけない。
                Backbone.Model.apply(this, arguments);
            },
            //デフォルト値
            defaults: {
                name: "DefaultName"
            },

            hello: function () {
                return "hello";
            },
            sayHello: function () {
                //thisは自信をちゃんとさす模様。
                //属性の取得/更新は、自インスタンス内であってもget/setを使用する必要がある。
                return this.hello() + ",My Name Is " + this.get("name");
            },
        },
        //第二引数：スタティックメソッド、スタティックメンバーの定義
        {
            staticMember: "value",
            staticMethod: function () {
                return "static!"
            }
        }
    );

    //modelを呼び出す
    var modelInstance = new MyModel();
    equal(modelInstance.get('name'), 'DefaultName'); //デフォルトプロパティの取得
    //プロパティの取得・更新
    modelInstance.set('name', '111');
    equal(modelInstance.get('name'), '111'); //デフォルトプロパティの取得

    //インスタンスメソッド呼び出し
    equal(modelInstance.hello(), 'hello');
    equal(modelInstance.sayHello(), 'hello,My Name Is 111');

    //スタティックメソッドの取得・更新
    equal(MyModel.staticMember, 'value');
    equal(MyModel.staticMethod(), 'static!');

    //プロパティの存在確認
    //※メソッドの存在は確認できないらしい。
    ok(modelInstance.has('name'));
    ok(!modelInstance.has('NOTFOUND'));

    //プロパティの削除
    modelInstance.set('deletedProp', '1');
    modelInstance.unset('deletedProp');
    equal(undefined, modelInstance.get('deletedProp')); //undefined
    ok(!modelInstance.has('deletedProp')); //false

    //コンストラクタ呼び出し時、プロパティを指定する場合。
    modelInstance = new MyModel({
        name: 'aaa',
        value: 'bbb'
    });
    equal(modelInstance.get('name'), 'aaa');
    equal(modelInstance.get('value'), 'bbb');

    ////プロパティを連想配列として取得
    var attributes = modelInstance.attributes;
    equal(undefined, attributes.length, 2); //レングスは取れない・・・
    equal(attributes.name, 'aaa');
    equal(attributes.value, 'bbb');

    //attributesの値を直接変えると、model側も変わる。
    attributes.name = 'hoge';
    equal(modelInstance.get('name'), 'hoge');

    //attributesを使うと、プロパティのリフレクションができるよ。
    for (var name in attributes) {
        ok(true, name + "=" + attributes[name]); //name=hoge , value=bbb
        ok(true, name + "=" + modelInstance.get(name)); //name=hoge , value=bbb
    }

});

test("モデルのシャローコピー", function () {
    var ChildModel = Backbone.Model.extend({
        defaults: {
            name: 'NAME',
            value: 'VALUE'
        }
    });

    var ParentModel = Backbone.Model.extend({
        defaults: {
            name: 'NAME',
            value: 'VALUE',
            child: new ChildModel()
        }
    });

    var parentModel = new ParentModel();
    equal(parentModel.get('name'), 'NAME');
    equal(parentModel.get('value'), 'VALUE');
    equal(parentModel.get('child').get('name'), 'NAME'); //シャローコピーした場合、オブジェクトはBackBoneのオブジェクトのまま。

    //シャローコピーを生成
    var shallowCopy = parentModel.toJSON();
    equal(shallowCopy.name, 'NAME');
    equal(shallowCopy.value, 'VALUE');
    equal(shallowCopy.child.get('name'), 'NAME');

    //シャローコピーなので、モデルの属性を変更しても、コピー側には影響しない。
    parentModel.set('name', 'HOGE');
    equal(shallowCopy.name, 'NAME');

    //シャローコピーなので、コピーが参照するオブジェクトはモデルとが同じ。
    parentModel.get('child').set('name', 'HOGE');
    equal(shallowCopy.child.get('name'), 'HOGE');

    //シャローコピーの連想配列を元に、オブジェクトのコピー生成が可能っぽい。
    var copyEntity = new ParentModel(
        //        parentModel.toJson()
        shallowCopy
    );
    equal(copyEntity.get('name'), 'NAME');
    equal(copyEntity.get('value'), 'VALUE');
    equal(copyEntity.get('child').get('name'), 'HOGE'); //子エンティティは、参照同じなので。

    //クローンでもよいらしい。この場合もやはりシャローコピー。
    parentModel = new ParentModel();
    var clone = parentModel.clone();
    parentModel.set('name', 'HOGE');
    equal(clone.get('name'), 'NAME');

    parentModel.get('child').set('name', 'HOGE');
    equal(clone.get('child').get('name'), 'HOGE');

});


test("モデルのバリデーション", function () {
    var ValidationModel = Backbone.Model.extend({
        //これはつらい。。。
        validate: function (attrs) {
            if (!attrs.name) {
                return 'name is required';
            } else if (!attrs.value) {
                return 'value is required';
            }
        }
    });

    var validationModel = new ValidationModel();
    //    ok(!validationModel.validate());
    ok(!validationModel.isValid()); //呼び出し側はisValid。
    equal(validationModel.validationError, 'name is required');

    validationModel = new ValidationModel({
        name: "hoge"
    });
    ok(!validationModel.isValid());
    equal(validationModel.validationError, 'value is required');

    validationModel = new ValidationModel({
        name: "hoge",
        value: 'HOGE'
    });
    ok(validationModel.isValid());

    //冗長で大変なので、backbone.validatorプラグインを使ったほうがよさそう。
});

test("backbone.validatorのテスト", function () {

    //TODOちゃんと見ていないので追って調査するが、Backbone.ValidationをバインドしたView上でのみ動作するらしい。
    //詳細はそのうち。
    //あとValidatorの拡張次第では、サーバーバリデーションもあり。

    //https://github.com/thedersen/backbone.validation
    //http://hozunomiya.xyz/?p=73 ここ使える。

    var V = Backbone.View.extend({
        el: $('#main'),
        events: {
            'click #btn': 'onBtnClick',
        },
        onBtnClick: function (e) {
            this.model.set({
                mail: 'hoge@example.com'
            }, {
                validate: true
            });
            ok(!this.model.isValid());
            for (var prop in this.model.validationError) {
                ok(true, prop + "=" + this.model.validationError[prop]); //エラーメッセージが表示されるよ。
            }
        },
        validationError: function (model, messages) {
            console.log(messages);
        },
        initialize: function (options) {
            Backbone.Validation.bind(this);
            this.listenTo(this.model, 'invalid', this.validationError);
        },
    });

    var M = Backbone.Model.extend({
        defaults: function () {
            return {
                name: null,
                address: null,
                mail: null
            };
        },
        validation: {
            name: {
                required: true,
            },
            address: {
                required: true,
            },
        },
    });

    var v = new V({
        model: new M(),
    });

    v.onBtnClick(null);
});

test("モデルの属性変更検知のテスト", function () {

    var obj = new Backbone.Model({
        name: 'name',
        value: 'value',
        child: new Backbone.Model({
            name: 'NAME'
        })
    });

    //何も変更してない
    //変更されたプロパティを取得。
    var changed = obj.changed;
    equal(_.size(changed), 0); //連想配列のサイズはunderscoreでとれるよ

    //nameを書き換える
    obj.set('name', 'changed');
    //変更されたプロパティを取得。
    changed = obj.changed;
    equal(_.size(changed), 1); //連想配列のサイズはunderscoreでとれるよ
    for (var name in changed) {
        ok(true, name + '=' + changed[name]); // name = changed
    }

    //プロパティ変更を確認
    ok(obj.hasChanged('name'));
    ok(!obj.hasChanged('value'));

    //参照しているオブジェクトを変更すると？
    obj.get('child').set('name', 'changed');
    ok(obj.get('child').hasChanged('name'));

    //changedメソッドでは確認できないので、再帰的に呼ばないとだめか…面倒。
    changed = obj.changed;
    equal(_.size(changed), 1); //連想配列のサイズはunderscoreでとれるよ
    for (var name in changed) {
        ok(true, name + '=' + changed[name]); // name = changed
    }

});

test("モデルのメソッド（underscore.jsのメソッド）を使用するテスト", function () {

    var MyModel = Backbone.Model.extend({
        defaults: {
            name: "Name",
            value: "Value"
        }
    });

    var myModel = new MyModel();

    //全てのプロパティの名前をリストで取得する
    var keys = myModel.keys();
    equal(keys.length, 2);
    ok(_.contains(keys, "name"));
    ok(_.contains(keys, "value"));

    //全てのプロパティの値前をリストで取得する
    var values = myModel.values();
    equal(values.length, 2);
    ok(_.contains(values, "Name"));
    ok(_.contains(values, "Value"));

    //指定した名前のプロパティだけを抽出する
    var picked = myModel.pick('name');
    keys = _.keys(picked);
    equal(keys.length, 1);
    ok(_.contains(keys, "name"));
    ok(picked.name, 'Name');

    //指定した名前以外のプロパティだけを抽出する
    var omitted = myModel.omit('name');
    keys = _.keys(omitted);
    equal(keys.length, 1);
    ok(_.contains(keys, "value"));
    ok(picked.name, 'Value');

    //ちなみに以下のようにすると、Modelに定義されたid属性など、エンティティの属性以外の値が取得されるので、Modelの場合はunderscore.jsを直接使用せず、
    //backbone.jsのModelがラップしている関数を使用する必要がある。
    //
    //omitted = _.keys(myModel);
    //alert(omitted);

    //おまけ いざとなれば型判断はできるよ！
    ok(myModel instanceof Backbone.Model);
    ok(myModel instanceof MyModel);
    ok(!(picked instanceof Backbone.Model));
});


test("モデルのRest", function () {
    //CORSを行うため。これがないと、HTML取得元サーバー以外の通信はエラーとなる。
    jQuery.support.cors = true;

    var MyModel = Backbone.Model.extend({
        //  urlRoot: "http://www.yahoo.co.jp/" 　…これにしておくと、urlRoot/idに対してリクエストを投げる。
        url: function () {
            return "http://weather.livedoor.com/forecast/webservice/json/v1?city=" + this.get('id')
        }
    });

    var myModel = new MyModel({
        id: 400040
    });

    stop();
    myModel.fetch().success(function () {
        ok(true, JSON.stringify(myModel)); //json文字列にして表示しないとわからん・・
        start();
    });

    //もし非同期にしない場合は、fetchの引数にjqueryのoptionを指定すれば良さそう。
    myModel.fetch({
        async: false
    }).success(function () {
        ok(true, JSON.stringify(myModel)); //json文字列にして表示しないとわからん・・
    });

    //parseを使うと、戻り値のJSONオブジェクトを解析し、その結果をモデルのアトリビュートとして使用できる。
    var ParseModel = Backbone.Model.extend({
        url: function () {
            return "http://weather.livedoor.com/forecast/webservice/json/v1?city=" + this.get('id')
        },
        parse: function (response) {
            //予想だけを返却する。
            return response.forecasts;
        }
    });

    var parseModel = new ParseModel({
        id: '400040'
    });

    parseModel.fetch({
        async: false
    }).error(function (a, b, c) {
        //指定できるハンドラはjQueryのハンドラと同じっぽい。
        alert(b);
        alert(c);
    });

    ok(true, JSON.stringify(parseModel));
});

test("モデルのRestその２：mockjax", function () {
    //CORSを行うため。これがないと、HTML取得元サーバー以外の通信はエラーとなる。
    jQuery.support.cors = true;

    var MyModel = Backbone.Model.extend({
        urlRoot: '/myModel'
    });

    var myModel = new MyModel({
        id: 1
    });

    $.mockjax({
        url: '/myModel/1',
        responseText: {
            name: "Name",
            value: "Value"
        }
    });

    stop();
    myModel.fetch().success(function () {
        start();
        ok(true, JSON.stringify(myModel));
    });
});

test("Viewのテスト", function () {
    //view
    var MyView = Backbone.View.extend({
        render: function () {
            this.$el.text('hello');
            return this;
        }
    });

    //viewを呼び出し、HTMLにrenderの結果を表示する。
    var viewInstance = new MyView();
    $('#custom-fixture').append(viewInstance.render().el);

    equal($('#custom-fixture').text(), 'hello');

});