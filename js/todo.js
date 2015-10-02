$(function () {
    'use strict';
    var Item = Backbone.Model.extend({
        defaults: {
            task: "",
            done: false
        },
        validate: function (data) {
            if (!data.task) {
                return "タスクを入力してください";
            }
        }
    });

    var ItemCollection = Backbone.Collection.extend({
        model: Item
    });

    var ItemView = Backbone.View.extend({
        initialize: function () {
            this.render();
            this.listenTo(this.model, 'change', this.render); //itemが変更されたらrenderをよぶ
            this.listenTo(this.model, 'remove', this.remove); //itemが削除されたらitemViewを破棄する
        },
        events: {
            "click .delete": "destroy"
        },
        destroy: function () {
            this.model.destroy();
        },
        render: function () {
            $(this.el).html(
                $.templates(ItemView.template).render(this.model.attributes)
            );
            return this;
        },
        remove: function () {
            $(this.el).remove();
        }
    }, {
        template: $('#item-template').html()
    });

    var ItemCollectionView = Backbone.View.extend({
        el: '#todo-table',
        initialize: function () {
            this.listenTo(this.collection, 'add', this.addItem);
        },
        addItem: function (item) {
            var itemView = new ItemView({
                model: item
            });
            this.$el.append(itemView.render().el);
        },
        render: function () {
            this.collection.forEach(function (element) {
                this.$el.append(element.render().el);
            });
            return this;
        }
    })

    var FormButton = Backbone.View.extend({
        el: '#todo-form',
        events: {
            'click #addTaskButton': 'click'
        },
        click: function (e) {
            e.preventDefault();
            var model = new Item({
                task: $('#todo-text').val()
            })
            model.isValid();
            this.collection.add(model);
        }
    });

    var itemCollection = new ItemCollection();
    var formButton = new FormButton({
        collection: itemCollection
    });
    var itemCollectionView = new ItemCollectionView({
        collection: itemCollection
    });

});