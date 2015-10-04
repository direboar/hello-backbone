$(document).ready(function () {
    //$(function () {
    'use strict';

    //TODOタスクのエンティティ。
    var Item = Backbone.Model.extend({
        defaults: {
            task: "",
            done: false
        },
        validate: function (data) {
            if (!data.task || data.task == "") {
                return "タスクを入力してください";
            }
        }
    });

    //TODOタスクのコレクション。
    var ItemCollection = Backbone.Collection.extend({
        model: Item
    });

    //Itemを表示するViewクラス
    var ItemView = Backbone.View.extend({
        initialize: function () {
            this.render();
            this.listenTo(this.model, 'change', this.render); //itemが変更されたらrenderをよぶ
            this.listenTo(this.model, 'remove', this.remove); //itemが削除されたらremoveをよぶ
        },
        //classがdeleteのボタンが押されたらdeleteを呼ぶ
        events: {
            "click .delete": "destroy"
        },
        //モデルを破棄する　⇒「itemが削除されたらitemViewを破棄する」のイベントが発火
        destroy: function () {
            this.model.destroy();
        },
        render: function () {
            //ItemViewが生成するdivタグにラップされてしまう
            //            $(this.el).html(
            //                $.templates(ItemView.template).render(this.model.attributes)
            //            );
            //            http://stackoverflow.com/questions/7894253/backbone-js-turning-off-wrap-by-div-in-render
            this.setElement($.templates(ItemView.template).render(this.model.attributes));
            return this;
        },
        //このViewを表すjQueryオブジェクトを破棄する
        remove: function () {
            $(this.el).remove();
        }
    }, {
        //jsrenderのテンプレートを読み込みキャッシュしておく
        template: $('#item-template').html()
    });

    //Itemのコレクションを表すView
    var ItemCollectionView = Backbone.View.extend({
        //描画先となるタグのIDを指定し、jQueryオブジェクトとしてキャッシュ
        el: '#todo-table',
        initialize: function () {
            //コレクションにaddされたらaddItemを呼ぶ
            this.listenTo(this.collection, 'add', this.addItem);
        },
        //追加されたItemを表示するためのItemViewを生成し、jQuertオブジェクトに追加する。
        addItem: function (item) {
            var itemView = new ItemView({
                model: item
            });
            //TODO 本当は、renderにもっていきたい。やりようは？
            this.$el.append(itemView.render().el);
        },
        render: function () {
            this.collection.forEach(function (element) {
                this.$el.append(element.render().el);
            });
            return this;
        }
    })

    //フォームを表すView。イベントハンドラのみ
    var TodoForm = Backbone.View.extend({
        el: '#todo-form',
        //#todo-form'以下にあるaddTaskButtonが押されたらclickを呼ぶ
        events: {
            'click #addTaskButton': 'click'
        },
        //モデルを生成し、コレクションに追加する。
        click: function (e) {
            e.preventDefault();
            var model = new Item({
                task: $('#todo-text').val()
            })
            if (!model.isValid()) {
                alert(model.validationError);
            } else {
                this.collection.add(model);
                $('#todo-text').val("");
            }
        }
    });

    var itemCollection = new ItemCollection();
    var todoForm = new TodoForm({
        collection: itemCollection
    });
    var itemCollectionView = new ItemCollectionView({
        collection: itemCollection
    });

});