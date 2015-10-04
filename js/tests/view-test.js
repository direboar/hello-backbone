// 1 テストのグルーピング
module("backbone.view-test", {
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


test("Viewのテスト", function () {
    //既にDOM上に存在するElementを書き換える場合。
    var MyView = Backbone.View.extend({
        // el属性にidを指定すると、該当IDを指すjQueryオブジェクトがキャッシュされる。jQueryオブジェクトは$elで取得できる。
        el: '#custom-fixture',
        getEl: function () {
            return this.$el.text();
        }
    });

    //getElメソッド内で、$elにより指定したIDのjQueryオブジェクトが取得できることを確認。
    $("#custom-fixture").text('CONTENT');
    var myView = new MyView();
    equal(myView.getEl(), 'CONTENT');

    //まだDOM上に存在しないElementを生成する場合。
    var NewView = Backbone.View.extend({
        tagName: "div",
        className: 'newClass',
        id: function () {
            return _.uniqueId('newView');
        },
        attributes: {
            attr1: 'val1',
            attr2: 'val2'
        },

        rendor: function () {
            return this.$el.html('aaa');
            return this;
        },
        getEl: function () {
            //this.elはDOMオブジェクト。elを定義していない場合は、評価時にtagNameなどから該当するDOMオブジェクトが生成される。
            return this.el;
            //            return $(this.el).html();
        },
    });

    var newView = new NewView();
    ok(true, newView.getEl()); //dom element <div className='newClass' id='xxx' attr1='val1' attr2='val2'/>

    //render
    //elを定義している場合、対象のelが指定しているタグの中身を書き換える処理を実装する。
    var RenderSmallSample = Backbone.View.extend({
        el: '#custom-fixture',
        render: function () {
            this.$el.text("hello!")
            return this;
        }
    });

    var renderSmallSample = new RenderSmallSample();
    renderSmallSample.render();
    equal('hello!', $("#custom-fixture").text());
});

test("Viewのテスト２", function () {
    //elを定義していないViewの生成物を表示

    var ChildView = Backbone.View.extend({
        tagName: 'div',
        className: 'myClass',
        render: function () {
            //this.elに生成されたDOMを編集。
            $(this.el).append('hoge');
            return this;
        }
    });

    var ParentView = Backbone.View.extend({
        el: '#custom-fixture',
        render: function () {
            var childView = new ChildView();
            //childViewが生成したdomオブジェクトを$elに追加。
            this.$el.append(childView.render().el);
            return this;
        }
    });

    var parentView = new ParentView();
    parentView.render();
    equal('<div class=\"myClass\">hoge</div>', $("#custom-fixture").html());

});

test("Viewのイベント処理", function () {

    var buttonClicked = false;
    var EventView = Backbone.View.extend({
        el: '#custom-fixture',
        events: {
            'click #button': 'click' // #custom-fixture以下にあるbuttonがクリックされたら、clickを呼ぶ
        },
        render: function () {
            this.$el.append('<button id="button">button</button>');
            return this;
        },
        click: function () {
            buttonClicked = true;
        }
    });

    var eventView = new EventView();
    eventView.render();
    $('#button').click();
    ok(buttonClicked);

});


test("Viewのテスト3:jstemplateを使う。", function () {
    //elを定義していないViewの生成物を表示

    var ChildView = Backbone.View.extend({
        render: function () {
                //this.elに生成されたDOMを編集。
                //編集には、jsrenderを使用する。
                var rendered = $.templates(ChildView.template).render({
                    title: 'TITLE',
                    message: 'MESSAGE'
                });
                $(this.el).append(rendered);
                return this;
            }
            //htmlに記述したテンプレートを取得し、staticフィールドに保持。
    }, {
        template: $('#hoge-template').html()
    });

    var ParentView = Backbone.View.extend({
        el: '#custom-fixture',
        render: function () {
            var childView = new ChildView();
            //childViewが生成したdomオブジェクトを$elに追加。
            this.$el.append(childView.render().el);
            return this;
        }
    });

    var parentView = new ParentView();
    parentView.render();
    ok(true, $("#custom-fixture").html());

});