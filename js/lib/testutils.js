/**自作のログ出力ユーティリティ。*/

//**名前空間**//
var testutils;
if(!testutils){
	testutils = {};
}

/**
  * minukuba_utils.logger
  *
  * minukuba_utils.logger.setLevel(2);
  * minukuba_utils.logger.log("message");
  * minukuba_utils.logger.log("message",1)
  * minukuba_utils.logger.log("message",2)
  * minukuba_utils.logger.log("message",3)
  *
  * 出力先拡張例
  * minukuba_utils.logger.write = function(message){
  *     $('#log-message-ol').append('<li>'+message+'</li>');
  * }
  *
  **/
(function (testutils) {
	var Logger = function(){
		this.level = 1;
	};

	Logger.prototype.setLevel = function(level) {
		this.level = level || 1;
	}

	Logger.prototype.log = function(message,level) {
		level = level || 1;
		if(this.level <= level){
			this.write(_.escape(message)); //use underscore.js
		}
	}

	Logger.prototype.dump = function(object,level) {
		level = level || 1;
		if(this.level <= level){
			var message = "";
			for (var name in object) {
				message = message + name +"="+object[name] + ",";
			}
			this.write(_.escape(message)); //use underscore.js
		}
	}

	Logger.prototype.write = function(message){
		console.log(message);
	}

	testutils.logger = new Logger();

}(testutils));

/**
 * qUnit Fixtureの代替を実現するクラス
 * id='<#qunit-fixture'>を使用した場合、対象のdivはブラウザに表示されずわかりづらい。
 * そのため、上記以外のdivを設け、対象のdivのテスト毎初期化処理を行う。
 * また、ajaxで外部HTMLを読み込める。（ファイル指定のため、JSCoverを使用するなど、クロスブラウザ対策は必要。）
 * **TODO コメント追加**
 */
(function(testutils){
	var HtmlFixture = function(){
		this.savedHtml = '';
		this.id = '#custom-fixture';
	}

	HtmlFixture.prototype.setupFixture = function storeFixture() {
		var fixture = $(this.id);
		if ( fixture ) {
			this.savedHtml = fixture.html();
		}
		testutils.logger.log("setupFixture:"+this.savedHtml)
	}

	HtmlFixture.prototype.replaceFixture = function replaceFixture(replaceHtml) {
		if(replaceHtml != undefined && replaceHtml != null){
			$.ajax(
				{
					async : false,
					type : 'GET',
					url : replaceHtml,
					dataType : 'html',
					success  : function(data){
						testutils.logger.log("replaceFixture:"+data)
						$("#custom-fixture").html(data);
					},
					error : function(xhr, textStatus, errorThrown){
						testutils.logger.log(textStatus);
						testutils.logger.log(errorThrown);
					}
				}
			);
		}
	}

	HtmlFixture.prototype.teardownFixture = function restoreFixture(){
		var fixture = $(this.id);
		if ( fixture ) {
			fixture.html(this.savedHtml);
		}
		testutils.logger.log("teardownFixture:"+this.savedHtml)
	}

	testutils.htmlfixture = new HtmlFixture();
}(testutils));
