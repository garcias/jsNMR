
/*!
 * jsGraphs JavaScript Graphing Library v@VERSION
 * http://github.com/NPellet/jsGraphs
 *
 * Copyright 2014 Norman Pellet
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		
		module.exports = factory( global );
			
	} else {

		factory( global );

	}

// Pass this if window is not defined yet
}( ( typeof window !== "undefined" ? window : this ), function( window ) {

	"use strict";

	var ns = 'http://www.w3.org/2000/svg';

		var Constructor = function( options ) {

		//	domMolecule, domGraphs, domGlobal, moleculeFilter, graphs
			var self = this;

			this.options = options;
			this.bindingPairs = [];

			var binding = false,
			bindingA = false,
			bindingB = false,
			bindingLine,
			highlighted = {},
			targetting,
			stashedLines = [],
			currentLines = [],

			mousedown = function( el, event, element ) {

				checkBindingPairs();

				if( event.shiftKey ) {

					for( var i in options.graphs ) { // We need to lock all graphs to prevent actions on the shapes.
						options.graphs[ i ].lockShapes();	
					}
					
					binding = true;
					self[ element ] = el;

					event.preventDefault();
					event.stopPropagation();
				}

				// Try to be smart and determine where to put the line ?

				var bb = el.getBBox();
				var pos = $( el ).position(),

				x = pos.left + bb.width / 2,
				y = pos.top + bb.height / 2;

				bindingLine.setAttribute('display', 'block');

				bindingLine.setAttribute('x1', x );
				bindingLine.setAttribute('x2', x );

				bindingLine.setAttribute('y1', y );
				bindingLine.setAttribute('y2', y );



				targetting = otherTarget( element ); 
				if( options[ otherTarget( element ) ].targettable ) {

					var targetEls = findTargettableElements( otherTarget( element ) );

					targetEls.each( function( ) {

						if( this.jsGraphIsShape ) {

							this.jsGraphIsShape.highlight( options[ otherTarget( element ) ].targettable, "binding" );

						} else {

							storeAttributes( options[ otherTarget( element ) ].targettable, $( this ) );
							$( this ).attr( options[ otherTarget( element ) ].targettable );

						}
					} );
				}

			},

			otherTarget = function( target ) {

				if( target == "jsGraphShape") {
					return "targetB";
				}

				return "jsGraphShape";
			},

			findTargettableElements = function( target ) {

				return $( options[ target ].dom ).find( options[ target ].bindableFilter );
			},


			mouseup = function( el, event, target ) {

				checkBindingPairs();
				

				if( targetting ) {

					if( options[ targetting ].targettable ) {

						var targetEls = findTargettableElements( targetting );

						targetEls.each( function( ) {

							if( this.jsGraphIsShape ) {

								this.jsGraphIsShape.unHighlight( "binding" );

							} else {

								restoreAttributes( options[ targetting ].targettable, $( this ) );
							}
						} );
					}
				

				}

				targetting = false;
				
				if( binding && ! target ) {
					bindingLine.setAttribute('display', 'none');
					binding = false;
					
					return;
				}

				if( ! binding ) {
					return;
				}

				var domTarget = event.target;
	
				
				bindingLine.setAttribute('display', 'none');

				if( ! $( domTarget ).is( options[ target ].bindableFilter ) && ! $( domTarget ).get( 0 ).classList.contains( options[ target ].bindableFilterClass ) > -1 ) {

					binding = false;

				} else {

					self[ target ] = event.target;


					binding = false;
					bindSave();

		

				}

				
				
				for( var i in options.graphs ) { // We can now unlock everything
					options.graphs[ i ].unlockShapes();	
				}			
			},

			mousemove = function( e ) {

				checkBindingPairs();
				

				if( ! binding ) {
					return;
				}

				bindingLine.setAttribute('x2', e.clientX + window.scrollX );
				bindingLine.setAttribute('y2', e.clientY + window.scrollY );
			},

			highlight = function( element, target ) {
				
				checkBindingPairs();
				
				var elements = [ element ];
				if( options[ target ].highlighted ) {
					elements = getEquivalents( target, element );
					highlightEquivalents( target, elements );
				}
				
				//getEquivalents( target, selector );


				var eqs = [];
				
//				unhighlight( element, target );
				for( var i = 0, l = elements.length; i < l; i ++ ) {
			
					allPairs( highlightPair, elements[ i ], function( pair ) {
						eqs = eqs.concat( $.makeArray( getEquivalents( otherTarget( target ), pair[ otherTarget( target ) ] ) ) );
					} );
				}

				
				eqs = $( eqs );
				
				if( options[ otherTarget( target ) ].highlighted ) {
					highlightEquivalents( otherTarget( target ), eqs );
				}
				
			},

			unhighlight = function( element, target, force ) {

			/*	if( binding && ! force) {
					return;
				}
*/
				checkBindingPairs();
				var elements = getEquivalents( target, element );
				
				var eqs = [];

				for( var i = 0; i < elements.length; i ++ ) {

					allPairs( unhighlightPair, elements[ i ], function( pair ) {
						eqs = eqs.concat( $.makeArray( getEquivalents( otherTarget( target ), pair[ otherTarget( target ) ] ) ) );
					} );
				}


				highlighted.jsGraphShape.map( function( el ) {
					this.jsGraphIsShape.unHighlight( "assignmentHighlighted");
				} );

				restoreAttributes( options.targetB.highlighted, highlighted.targetB );
				
			},

			highlightEquivalents = function( target, elementsToHighlight ) {

				var highlightedAttributes = options[ target ].highlighted;

				if( elementsToHighlight[ 0 ] && elementsToHighlight[ 0 ].jsGraphIsShape ) {

					elementsToHighlight.map( function( el ) {

						this.jsGraphIsShape.highlight( highlightedAttributes, "assignmentHighlighted");
					} );

				} else {

					storeAttributes( highlightedAttributes, elementsToHighlight );
					elementsToHighlight.attr( highlightedAttributes );

				}

				highlighted[ target ] = elementsToHighlight;

			},

			getEquivalents = function( target, element ) {
				var selector = element.getAttribute( options[ target ].attributeEquivalents );
				return $( options[ target ].dom ).find( "[" + options[ target ].attributeEquivalents + "=\"" + selector + "\"]");
			},

			storeAttributes = function( attr, els ) {

				for( var i in attr ) {
					

					for( var j = 0, l = els.length; j < l; j ++ )  {
							
						if( ! $( els[ j ]  ).data( "backup-" + i ) ) {	
							$( els[ j ]  ).data( "backup-" + i, $( els[ j ]  ).attr( i ) );
						}
					}

				}
			},

			restoreAttributes = function( attr, els ) {

				for( var i in attr ) {

					for( var j = 0, l = els.length; j < l; j ++ )  {

						$( els[ j ] ).attr( i, $( els[ j ]  ).data('backup-' + i ) );
					}
				}
			},

			allPairs = function( fct, element, callback ) {

				for( var i = 0, l = self.bindingPairs.length ; i < l ; i ++ ) {

					if( self.bindingPairs[ i ].jsGraphShape == element || self.bindingPairs[ i ].targetB == element ) {

						fct( self.bindingPairs[ i ] );

						if( callback ) {
							callback( self.bindingPairs[ i ] );
						}
					}
				}
			},

			highlightPair = function( pair ) {


				var posA = $( pair.jsGraphShape ).offset();
				var posB = $( pair.targetB ).offset();

				var bbA = $( pair.jsGraphShape )[ 0 ].getBBox();
				var bbB = $( pair.targetB )[ 0 ].getBBox();

				var posMain = options.domGlobal.offset();

				var line;

				if( stashedLines.length > 0 ) {
					line = stashedLines.pop();
					line.setAttribute('display', 'block');
				} else {
					line = document.createElementNS( ns, 'line');	
				}

				
				line.setAttribute('stroke', 'black');
				line.setAttribute('x1', posA.left - posMain.left + bbA.width / 2 );
				line.setAttribute('y1', posA.top - posMain.top + bbA.height / 2  );
				line.setAttribute('x2', posB.left - posMain.left + bbB.width / 2 );
				line.setAttribute('y2', posB.top - posMain.top + bbB.height / 2 );

				pair.line = line;
				currentLines.push( line );

				topSVG.appendChild( line );
			},


			unhighlightPair = function( pair ) {

				pair.line = false;

				currentLines.map( function( line ) {

					line.setAttribute('display', 'none');

				} );

				stashedLines = stashedLines.concat( currentLines );
				currentLines = [];
	
				
			},

			bindSave = function() {

				var pair;
				if( pair = lookForPair( self.jsGraphShape, self.targetB ) ) {
					removePair( pair );
					unhighlightPair( pair );
					return false;
				}

				unhighlight( self.jsGraphShape, "jsGraphShape", true );

				self.bindingPairs.push( { jsGraphShape: self.jsGraphShape, targetB: self.targetB } );

				self.jsGraphShape.jsGraphIsShape.setStrokeDasharray("5,5");
				self.jsGraphShape.jsGraphIsShape.applyStyle();
			
				bindingA = null;
				bindingB = null;

				console.log( self.getAssignment() );


			},

			removePair = function( pair ) {
				self.bindingPairs.splice( self.bindingPairs.indexOf( pair ), 1 );
			},

			lookForPair = function( A, B ) {

				self.bindingPairs.map( function( pair ) {

					if( pair.jsGraphShape == A || pair.targetB == B ) {
						return pair;
					}
				} );

				return false;
			},

			checkBindingPairs = function() {

				for( var i = 0, l = self.bindingPairs.length ; i < l ; i ++ ) {

					if( $( options.jsGraphShape.dom ).get( 0 ).contains( self.bindingPairs[ i ].jsGraphShape ) && $( options.targetB.dom ).get( 0 ).contains( self.bindingPairs[ i ].targetB ) ) {
						continue;
					} else {

						self.bindingPairs[ i ] = false;
					}
				}
			},

			setEvents = function( ) {

				options.jsGraphShape.dom.on('mousedown', options.jsGraphShape.bindableFilter, function( e ) {
					
					mousedown( this, e, "jsGraphShape" );
				});

				options.jsGraphShape.dom.on('mouseover', options.jsGraphShape.bindableFilter, function( e ) {
					
					highlight( this, "jsGraphShape" );
				});

				options.jsGraphShape.dom.on('mouseout', options.jsGraphShape.bindableFilter, function( e ) {
					unhighlight( this, "jsGraphShape" );
				});

				options.targetB.dom.on('mousedown', options.targetB.bindableFilter, function( e ) {
					mousedown( this, e, "targetB" );
				});

				options.targetB.dom.on('mouseover', options.targetB.bindableFilter, function( e ) {
					highlight( this, "targetB" );
				});

				options.targetB.dom.on('mouseout', options.targetB.bindableFilter, function( e ) {
					unhighlight( this, "targetB" );
				});

				options.jsGraphShape.dom.on('mouseup', function( e ) {
					mouseup( this, e, "jsGraphShape" );
				});

				options.targetB.dom.on('mouseup', function( e ) {
					mouseup( this, e, "targetB" );
				});

				options.domGlobal.on('mouseup', function( e ) {
					mouseup( this, e, false );
				})

				options.domGlobal.on('mousemove', function( e ) {
					mousemove( e );
				})
			};


			var topSVG = document.createElementNS( ns, 'svg' );
			topSVG.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
			topSVG.setAttribute('xmlns', ns );
		
			topSVG.setAttribute('style', 'position: absolute');
			topSVG.setAttribute('width', options.domGlobal.width( ) )
			topSVG.setAttribute('height', options.domGlobal.height( ) )
			topSVG.setAttribute('pointer-events', 'none');

			bindingLine = document.createElementNS( ns, 'line');
			bindingLine.setAttribute('stroke', 'black');

			topSVG.appendChild( bindingLine );

			options.domGlobal.prepend( topSVG );
			setEvents( );	
	};

	Constructor.prototype.getAssignment = function() {

		var self = this;

		return this.bindingPairs.map( function( pair ) {

			if( ! pair ) {
				return undefined;
			}

			var attrA = pair.jsGraphShape.getAttribute( self.options.jsGraphShape.attributeEquivalents );
			var attrB = pair.targetB.getAttribute( self.options.targetB.attributeEquivalents );

			return [ attrA, attrB ];
		} );
	}


	Constructor.prototype.findElement = function( target, selector ) {

		return $( this.options[ target ].dom ).find( "[" + this.options[ target ].attributeEquivalents + "=\"" + selector + "\"]");	
	};


	Constructor.prototype.setAssignment = function( pairs ) {

		var self = this;
		self.bindingPairs = [];

		pairs.forEach( function( pair ) {

			self.bindingPairs.push( { jsGraphShape: self.findElement( 'jsGraphShape', pair[ 0 ] ), targetB: self.findElement( 'targetB', pair[ 1 ] ) } );

		} );
	}


	var Assignment = function( $ ) {
		return Constructor;
	};

	if( typeof define === "function" && define.amd ) {
		define( [ 'jquery' ], function( $ ) {
			return Assignment( $ );
		});
	} else if( window ) {

		if( ! window.jQuery ) {
			throw "jQuery has not been loaded. Abort assignment initialization."
			return;
		}

		window.Assignment = Assignment( window.jQuery );
	}
}));