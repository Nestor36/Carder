/*
 * Credit Card Type Indication (carder)
 * http://wesleytodd.com/
 * http://whitelion.com/
 *
 * Version 1.2
 *
 * Requires   jQuery > 1.7
 *
 * Basic Usage:
 * $('input').carder();
 *
 */
var Carder = (function($, exports){

	/**
	 * Constructor
	 */
	var Carder = function(el, options){
		this.$el = $(el);
		this.$el.data('carder', this);
		this.options = $.extend({}, Carder.defaultOptions, options);
		this.matchType = false;
		this.rawVal = '';

		this.$logos = $(Carder.generateLogoMarkup(
			this.options.ccLogos,
			this.options.logoMarkup,
			this.options.logoTemplate,
			this.options.logoClass + ' ' + this.options.highlightClass
		));

		//Create and add the credit card logo's to the page
		if(typeof this.options.logoPosition == 'function'){
			this.options.logoPosition.call(this, this.$logos);
		}else if(this.options.logoPosition == 'after'){
			this.$el.after(this.$logos);
		}else if(this.options.logoPosition == 'before'){
			this.$el.before(this.$logos);
		}

		//If using the ccid image then set that up
		if(typeof this.options.ccidIcon == 'function') {
			this.$ccidIcon = this.options.ccidIcon.call(this);
		}else if(this.options.ccidIcon instanceof jQuery) {
			this.$ccidIcon = this.options.ccidIcon;
		} else if(this.options.ccidIcon !== false){
			this.$ccidIcon = $(Template(this.options.ccidTemplate)({'ccid-icon' : this.options.ccidImages.standard})).hide();
			this.$el.after(this.$ccidIcon);
		}

		// Access to plugin in event handelers
		var that = this;

		// Bind handlers
		this.$el.on({
			keyup : function(e){
				// Clear timeout on keyup
				clearTimeout(that.keyUpTimeout);

				// Only match if the value has changed
				if($(this).val() != that.rawVal){
					that.keyUpTimeout = setTimeout(function(){
						// Is match partial on?
						var partial = that.options.matchPartial;

						// If previous error, don't match partial
						if(that.error) partial = false;

						that.rawVal = that.$el.val();
						that.matchType = Carder.testCard(that.rawVal, that.options.supportedCC, partial);
						if(that.matchType){
							that.setCardType(that.matchType);
						}else{
							that.clearCardType();
						}
					}, that.options.keyUpTimeout);
				}
			},
			blur : function(e){
				// Cache the value
				that.rawVal = $(this).val();
				if(that.rawVal.length !== 0){
					that.matchType = Carder.testCard(that.rawVal, that.options.supportedCC, false);
					if(that.matchType){
						that.setCardType(that.matchType);
					}else{
						that.setError();
					}
				}
			}
		});
	};

	Carder.prototype.clearCardType = function(){
		// Add highlight class to all
		this.$logos
			.find('.' + this.options.logoClass)
			.addClass(this.options.highlightClass);
	};

	Carder.prototype.setCardType = function(type){
		this.clearError();
		// Remove highlight class from all
		this.$logos
			.find('.' + this.options.logoClass)
			.removeClass(this.options.highlightClass);

		// Add highlight class to matched type
		this.$logos
			.find('.' + type)
			.addClass(this.options.highlightClass);

		// Set ccid icon
		if(this.$ccidIcon){
			this.$ccidIcon.attr('src', this.options.ccidImages[this.options.ccidRelationship[type]]);
			this.$ccidIcon.fadeIn('slow');
		}
	};

	Carder.prototype.setError = function(){
		//Create and add the error message
		if(typeof this.$errorLabel == 'undefined'){
			this.$errorLabel = $(Template(this.options.errorTemplate)({
				errorClass   : this.options.errorClass,
				elId         : this.$el.attr('id'),
				errorMessage : this.options.errorMessage
			}));
			if(typeof this.options.errorPosition == 'function'){
				this.options.errorPosition.call(this, this.$errorLabel);
			}else if(this.options.errorPosition == 'after'){
				this.$el.after(this.$errorLabel);
			}else if(this.options.errorPosition == 'before'){
				this.$el.before(this.$errorLabel);
			}
		}
		this.$errorLabel.show();
		this.error = true;
		this.$el.addClass(this.options.errorClass);
		this.clearCardType();
	};

	Carder.prototype.clearError = function(){
		this.error = false;
		this.$el.removeClass(this.options.errorClass);
		if(typeof this.$errorLabel != 'undefined'){
			this.$errorLabel.hide();
		}
	};


	/**
	 * Generate logo markup from templates
	 */
	Carder.generateLogoMarkup = function(logos, template, logoTemplate, classes){
		var out  = '',
			tmpl = Template(logoTemplate);
		$.each(logos, function(i,v){
			out += tmpl({
				classes   : classes + ' ' + i,
				cardname  : i,
				cardimage : v
			});
		});
		return Template(template)({'cc-logos' : out});
	};

	/**
	 * Test card number
	 */
	Carder.testCard = function(value, regexes, matchPartial){
		// Must be all digits
		if(value.match(/[^\d\s\-]/) || value === '') return false;

		//Clean off formatting
		value = value.replace(/\D+/g, '');

		// Match Partial defaults to true
		matchPartial = (typeof matchPartial != 'undefined') ? matchPartial : true;

		// Find a match
		var match = false,
			matchType = false;
		$.each(regexes, function(i,v){
			if(!match){
				match = value.match(new RegExp(v.full));
				if(!match && matchPartial && value.length < 17){
					match = value.match(new RegExp(v.partial));
				}
				if(match){
					matchType = i;
				}
			}
		});
		return matchType;
	};

	/**
	 * Default Options
	 */
	Carder.defaultOptions = {
		matchPartial   : true,
		keyUpTimeout   : 500,
		logoClass      : 'logo',
		highlightClass : 'highlight',
		logoPosition   : 'after',
		logoMarkup     : '<div class="carder-logos">{{cc-logos}}</div>',
		logoTemplate   : '<img class="{{classes}}" alt="{{cardname}}" src="{{cardimage}}" />',
		ccidIcon       : false,
		ccidTemplate   : '<img src="{{ccid-icon}}" />',
		ccLogos        : {
			'visa'       : 'data:image/gif;base64,R0lGODlhOQAjAPcAAABEjGagzdqIAAAofNNuAJq/0zl+rwBJkABZlgASbgBQkyJupgAsgAA6hwBGjdmDAE2LtzN7rXOlx85lAABjngBJjgAzggAqfABSlNmGAAAZcgBUlQBCjIezzQBcnAA3hQAneQA1gwAWcQA4hQBenAAfdgAgdAAtfgBAiQA8hgA9iABamQBZmwBXmABWlgAwgABNkgAieAA+iQBZmABQlABOlABMkQAOaxNnnmWdwmadw22hxduMAxNnn2afzGaexgBBimmfxABVlgBVl7fR4diEANV5AP///AA0gW6ixWai0f///tJ1AABCiuOxVgBKjgBUlmaex9mFAABAipi91ZC2z3qoyWqfxABKjdzn8QAIaJS70wBgnafI29yOAy52qpG80tfp7cHb5pK60zSArWyfwQBSlvj9/QAXbwBEi16YvfH5+v3+/tZ7AKDC1dLg6Rlro2Wew3qqyfX4+ESGtKbF2gtinI+40gAFZd+mRFSTu6zK34i10NmEANNxAE+OuXWryABGjvz/+f3//XikxwAsehRon5i/0xRooOCtUe/0+WygxmyixGyixtjo7GWcvhRnn+GrRghdm93r8Yixy4qxzsje52aeyHOiwfD3+I620Orx9O709mObwJ3E3IWzzwAbdEuJswBhoHKoyM9sAABbm7DM2rLM27PP2+GuTG+kxPP4+vz8/Zi909/o74i1zwBUkT+Fsg9inGacxD2AtJ6+1T+EtBxrowA5hZS90oCvyoWuylORux9updvn7nyoyUKDs+Tu9EGFsefw8wBRlmacwkuMtjZ9rwAxgSl1psTZ5MTY5whhnGadwYy60VqSul2VvGiexGmexXepx73U5LzW5gA6iNmBAFqYvdnn6/v8/q7M3/X6+Za61Yu20GWcwtBxAPr8+dNyAJe+1k+NuVWRusfd6FaSu/H399Dg6lCRuQBem0yJtXeryU2PuP///eOwVdV2ANJ0ANuLAwBKjwBUl9uJAABdm9yNAwBOkmai0ABcm5q+1tuLAgBbmv///yH5BAAAAAAALAAAAAA5ACMAAAj/AMkRocKvoMGDCBMqXMgwIRUif3b8m0ixosWLGDNq3Lij0T8gNYbUG0mypMmTKFOqHDnkAIZ/0ZL8++BAQb6bOHPq3Mmzp8+bCoA4+HdFogMh9/YpXcq0qdOnUKMqJaEAyr8gEgFs2Oevq9evYMOKHUu26758G65m3Vq2rdu3/s6mxfovENJ7ePPq3cu3r9+/eKlaDSLTQhN6iBMrXsy4sePHiW2oAEJ00T9YzCDh2IyjB2fOnj93Fh1aNGjTog35k/VP2reNsGPL1vhNh8Zs1c5oy3TE4plJ/waxyTRnIrdcowB1uTiI1ZrYOWxnPPJMQwM05Sp+SKDgH6gRN9L9/3sE4oKIBBpifKHoynqCPbCjw0aQrwE2iuyQXfjXDcnNf9CU0IICznhCxg21UISBA+tY0Ep80mkEBz1AGDPRJhcwsMs/ksDQACH/gHAPEllQ1NtEVVxQAwm4/AIhbAscwAEdE7lggRkThVDKCe9kcYEoMnRS0RI5coAJMSno8eJGEQDgQAT/pMgAOv9sYUFLExVSAwXIJGMRMBpA8E8IAByzpEbCcAAALTMx8MhECzgwBTsTWRLDFBSocAE1EwVT3j+rIHHALWdmxMsUFahRxgVPUGSNPy8sUxEzFlBAgwmC/CPEAHdMhIsN/hSKURwpeDADDAP4MtE2FrTQxEW6qP/AxQn/EHEBDL0gYseAMIh6kRW4kOCBBaFQZEAaQBjwjykVKYIECzL8A4BWB6CABQtCULaRfBtR0gAFGKRQkQMrWGDOP3hgAEYY4zzRQgma8DHAARWh0IIMRGrErUaV3DBCAspQVIcWyJTwDyolgCCCCBqcMAAjnGiRgBgVxXDCDW9sG2FGjgDySgEVndJOB25QNIY67pzzSTj/FKDKIRZ14M00w2xbzGw457xRM5f8k0cqTsAj9NBEwxN00UgnrbTSTkSSyD+zBPDPBH7EY/XVWGet9dZcd401AeL8E4UP/7QhAD5op6322my37fbbaXshhRT//EC2ERnw0M/efPd27fffgAcu+N48PFBE3XfnPfjijDfeT+GH2/0P3jzMY/nlmGeu+eacd2455Ij/E08f9pRu+umop6766qyffs0DdUs9AQFMyGP77bjnrvvuvPduOxOkgCO2BDoXb/w/Etgihz5K6OP889BHL/301FcPvRIBWBFLQAA7',
			'amex'       : 'data:image/gif;base64,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',
			'mastercard' : 'data:image/gif;base64,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',
			'discover'   : 'data:image/gif;base64,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'
		},
		supportedCC     : {
			'visa'       : {
				full    : '^4[0-9]{12}(?:[0-9]{3})?$',
				partial : '^4[0-9]{0,15}$'
			},
			'amex'       : {
				full    : '^3[47][0-9]{13}$',
				partial : '^3[47][0-9]{0,13}$'
			},
			'mastercard'       : {
				full    : '^5[1-5][0-9]{14}$',
				partial : '^5[1-5][0-9]{0,14}$'
			},
			'discover'       : {
				full    : '^6(?:011|5[0-9]{2})[0-9]{12}$',
				partial : '^6(?:011|5[0-9]{2})[0-9]{0,12}$'
			}
		},
		ccidRelationship : {
			'visa'       : 'standard',
			'amex'       : 'amex',
			'mastercard' : 'standard',
			'discover'   : 'standard'
		},
		ccidImages      : {
			'standard'   : 'data:image/gif;base64,R0lGODlhZAA+ALMAAPHy9JSgpWlxcc7t/skjI7/O1sTi+OHg4LS4u8dydL/u/r7c9L/c9Dk3Nv///8Dd9CH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3ODZEODhGN0Y3QTMxMUUxQkNFOTk4OUJDMzQ5NzM0OSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3ODZEODhGOEY3QTMxMUUxQkNFOTk4OUJDMzQ5NzM0OSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjc4NkQ4OEY1RjdBMzExRTFCQ0U5OTg5QkMzNDk3MzQ5IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjc4NkQ4OEY2RjdBMzExRTFCQ0U5OTg5QkMzNDk3MzQ5Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU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',
			'amex'       : 'data:image/gif;base64,R0lGODlhZAA+ALMAANX67pKfmz87PrjYy9YEBcHt3bD++3uCg6XSwausrVteXsZYWpv//aTCs7ff0P///yH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3ODZEODhGQkY3QTMxMUUxQkNFOTk4OUJDMzQ5NzM0OSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3ODZEODhGQ0Y3QTMxMUUxQkNFOTk4OUJDMzQ5NzM0OSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjc4NkQ4OEY5RjdBMzExRTFCQ0U5OTg5QkMzNDk3MzQ5IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjc4NkQ4OEZBRjdBMzExRTFCQ0U5OTg5QkMzNDk3MzQ5Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU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'
		},
		errorTemplate    : '<label class="carder-label {{errorClass}}" for="{{elId}}">{{errorMessage}}</label>',
		errorClass       : 'error',
		errorMessage     : 'Please enter a valid credit card number.',
		errorPosition    : 'after'
	};

	/**
	 * jQuery fn
	 */
	$.fn.carder = function(options){
		return this.each(function(){
			new Carder(this, options);
		});
	};

	/**
	 * Really, Really  Basic Templates
	 */
	var Template = function(template){
		if(!(this instanceof Template)){
			return new Template(template);
		}else{
			var that = this;
				that.template = template;
			return function(data){
				var out = that.template;
				$.each(data, function(key, val){
					out = out.replace(RegExp('{{' + key + '}}', 'g'), val);
				});
				return out;
			};
		}
	};

	/**
	 * Export Carder?
	 */
	if(typeof exports != 'undefined' && exports) return Carder;

}).call(this, jQuery, Carder);
