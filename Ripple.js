const PropTypes = require('prop-types');
const React = require('react'), { PureComponent, Component } = require('react');
const {
	View,
	Animated,
	Easing,
	Platform,
	TouchableWithoutFeedback,
	I18nManager,
	StyleSheet,
} = require('react-native');

const radius = 100;
const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
		overflow: 'hidden',
	},
	ripple: {
		width: radius * 2,
		height: radius * 2,
		borderRadius: radius,
		overflow: 'hidden',
		position: 'absolute',
		transform: [{scale:0}],
	},
});

const StandardCurve = Easing.bezier(0.4, 0.0, 0.2, 1);
const TranslateCurve = Easing.bezier(0, 0.5, 0.5, 1);
const AcceleratedCurve = Easing.bezier(0.4, 0.0, 1, 1);
const DeceleratedCurve = Easing.bezier(0.0, 0.0, 0.2, 1);
const PathXCurve = Easing.out(Easing.ease);
const PathYCurve = Easing.in(Easing.ease);
const LinearMotion = Easing.linear;

const _grid = (props, state) => {
	let { width, height } = state;
	let {
		ghost, shifts, centered, borderless,
		gridColumn, gridRow,
		cellWidth, cellHeight, cellSize, cellBorderRadius, cellBorderless,
		morph, morphBorderRadius, morphDuration
	} = props;
	cellWidth = gridColumn > 0 ? width/gridColumn : (cellWidth > 0 ? cellWidth : cellSize > 0 ? cellSize : cellHeight);
	cellHeight = gridRow > 0 ? height/gridRow : (cellHeight > 0 ? cellHeight : cellSize > 0 ? cellSize : cellWidth);
	let grid = (cellSize > 0 || (cellWidth > 0 && cellHeight > 0))
	return { grid, cellWidth, cellHeight };
};

const _morphs = (props, state, grid, size) => {
	let {
		ghost, shifts, centered, borderless,
		gridColumn, gridRow,
		cellWidth, cellHeight, cellSize, cellBorderRadius, cellBorderless,
		morph, morphBorderRadius, morphDuration
	} = props;
	let morphs = (morph && !ghost && size <= 0 && (centered || shifts) && (borderless || (grid && cellBorderless)));
	return morphs;
};

const _slowed = (props, ghost, R, M) => {
	let {
		shifts, centered, borderless, max,
		slowStart, slowDuration, slowPreFade, ghostDelay, ghostDuration, highlight,
	} = props;
	// let now = Date.now()
	// let slowed = (!highlight || (now-time>ghostDelay));
	// let slowed = (!highlight || ghost || (slowStart && !slowPreFade) || (R===max/2 && R!==M));
	// let slowed = (!highlight || ghost || !(R===max/2 && R!==M));
	let slowed = !(R<=max/2 && R!==M);
	// console.log('_slowed', {slowed, highlight, ghost, slowStart, slowPreFade, R, max, M});
	return slowed;
};

const _conf = (inst) => {
	let { borderless, background, shifts, ghost, highlight } = inst.props;
	let color = inst.value('color', 'rippleColor'),
		size = inst.value('size', 'rippleSize');
	if (typeof background === 'object') {
		color = typeof background.color === 'string' ? background.color : color;
		size = typeof background.rippleRadius === 'number' ? background.rippleRadius * 2 : size;
		borderless = typeof background.borderless === 'boolean' ? background.borderless : borderless;
		shifts = typeof borderless === 'boolean' && borderless === true ? true : shifts;
		ghost = typeof background.borderless === 'boolean' ? true : (ghost || highlight);
	}
	return { color, borderless, size, shifts, ghost };
};

module.exports = class Ripple extends PureComponent {
	static defaultProps = {
		...TouchableWithoutFeedback.defaultProps,
		// rippleColor: 'rgb(0, 0, 0)',// Ripple color
		// rippleOpacity: 0.30,// Ripple opacity
		// rippleDuration: 400,// Ripple duration in ms
		// rippleSize: 0,// Ripple size restriction
		// rippleContainerBorderRadius: 0,// Ripple container border radius
		// rippleCentered: false,// Ripple always starts from center
		// rippleSequential: false,// Ripple should start in sequence
		// rippleFades: true,// Ripple fades out
		color: 'rgb(0, 0, 0)',// Ripple color
		opacity: 0.30,// Ripple opacity
		duration: 320,// Ripple duration in ms
		size: 0,// Ripple size restriction
		containerBorderRadius: 0,// Ripple container border radius
		centered: false,// Ripple always starts from center
		sequential: false,// Ripple should start in sequence
		fades: true,// Ripple fades out
		disabled: false,// Ripple should ignore touches
		onRippleAnimation: (animation, callback) => animation.start(callback),// Animation start callback
		onGridPress: (e, data) => {},// Animation start callback
		onGridLongPress: (e, data) => {},// Animation start callback
		max: 360,// Max size of ripple in dp
		cellSize: 0,// Cell size in dp for containing ripple animation
		cellWidth: 0,// Grid size width in dp for containing ripple animation
		cellHeight: 0,// Grid size height in dp for containing ripple animation
		gridColumn: 0,// Grid size width in dp for containing ripple animation
		gridRow: 0,// Grid size height in dp for containing ripple animation
		cellBorderless: true,// Grid containing ripple animation in grid cell
		cellBorderRadius: 0,// Grid cell border radius in dp
		cancelTolerance: 8,// Gesture tolerance in dp before cancelling ripple
		cancelDuration: 0,// Cancelling ripple animation duration
		cancelAnimated: false,// Cancelling ripple with animation
		shifts: false,// Ripple shifts in
		highlight: false,// Ripple ghosting on press-in, ignoring ghostDelay
		ghost: false,// Ripple ghosting in
		ghostRestriction: false,// Ripple ghosting size restriction
		ghostSize: 0,// Ripple ghost size
		ghostColor: 'rgb(0, 0, 0)',// Ripple ghost color
		ghostFades: true,// Ripple ghost fades in
		ghostOpacity: 0.10,// Ripple ghost opacity
		ghostDuration: 440,// Ripple ghost fade-in duration in ms (=slowDuration-ghostDelay)
		ghostDelay: 200,// Ripple ghost timeout in ms
		ghostUseForeground: true,// Render ripple ghost on foreground
		slowStart: true,// Ripple while hold down
		slowDuration: 640,// Ripple while hold down duration
		// slowPreFade: false,// Ripple while hold down fading before ghost
		// longPressPhasing: true,// Ripple auto phasing at long press
		morph: false,// Ripple morphing into rectangular shape afrer reaching full size
		morphBorderRadius: 0,// Ripple morphing rectangle border radius
		morphDuration: 320,// Ripple morphing duration
		borderless: false,// Rripple overflows from container
		useForeground: true,// Render ripple on foreground
		background: {},// TNF background option
		containerStyle: {},// container styles
	};

	static propTypes = {
		...Animated.View.propTypes,
		...TouchableWithoutFeedback.propTypes,
		color: PropTypes.string,
		opacity: PropTypes.number,
		duration: PropTypes.number,
		size: PropTypes.number,
		containerBorderRadius: PropTypes.number,
		centered: PropTypes.bool,
		sequential: PropTypes.bool,
		fades: PropTypes.bool,
		disabled: PropTypes.bool,
		onRippleAnimation: PropTypes.func,
		onGridPress: PropTypes.func,
		onGridLongPress: PropTypes.func,
		max: PropTypes.number,
		cellSize: PropTypes.number,
		cellWidth: PropTypes.number,
		cellHeight: PropTypes.number,
		gridColumn: PropTypes.number,
		gridRow: PropTypes.number,
		cellBorderless: PropTypes.bool,
		cellBorderRadius: PropTypes.number,
		cancelTolerance: PropTypes.number,
		cancelDuration: PropTypes.number,
		cancelAnimated: PropTypes.bool,
		shifts: PropTypes.bool,
		highlight: PropTypes.bool,
		ghost: PropTypes.bool,
		ghostRestriction: PropTypes.bool,
		ghostSize: PropTypes.number,
		ghostColor: PropTypes.string,
		ghostFades: PropTypes.bool,
		ghostOpacity: PropTypes.number,
		ghostDuration: PropTypes.number,
		ghostDelay: PropTypes.number,
		ghostUseForeground: PropTypes.bool,
		slowStart: PropTypes.bool,
		slowDuration: PropTypes.number,
		morph: PropTypes.bool,
		morphBorderRadius: PropTypes.number,
		morphDuration: PropTypes.number,
		borderless: PropTypes.bool,
		useForeground: PropTypes.bool,
		background: PropTypes.object,
		containerStyle: PropTypes.any,
	};

	state = {
		width: 0,
		height: 0,
		ripples: [],
	}
	
	phases = []
	ghosts = []
	// ghostX = new Animated.Value(0)
	// ghostY = new Animated.Value(0)
	// ghostAnim = new Animated.Value(0)
	// ghostScale = new Animated.Value(0)
	static canUseNativeForeground() { return true; }
	static SelectableBackground(rippleRadius) {
		return {type:'a', borderless:false, rippleRadius}
	}
	static SelectableBackgroundBorderless(rippleRadius) {
		return {type:'b', borderless:true, rippleRadius}
	}
	static Ripple(color, borderless, rippleRadius) {
		return {type:'c', color, borderless:!!borderless, rippleRadius}
	}
	static config(opts={}) {
		for(let k in opts) if(typeof opts[k] == typeof this.defaultProps[k]) {
			if(typeof opts[k] == 'object') for(let p in opts[k]) this.defaultProps[k][p] = opts[k][p];
			else this.defaultProps[k] = opts[k];
		}
	}
	constructor(props) {
		// console.log('RIPPLE ',props);
		super(props);
		this.unique = 0;
		this.mounted = false;
		// this.easingCurve = props.materialEasing ? StandardCurve : Easing.out(Easing.ease);
	}
	componentDidMount() {
		this.mounted = true;
	}
	componentWillUnmount() {
		this.mounted = false;
	}
	onLayout = (event) => {
		let { width, height } = event.nativeEvent.layout;
		let { onLayout } = this.props;
		let w2 = width/2, h2 = height/2;
		if (typeof onLayout === 'function') {
			onLayout(event);
		}
		this.setState({ width, height });
		// this.ghostX.setValue(w2-radius);
		// this.ghostY.setValue(h2-radius);
	}
	onPress = (event) => {
		let { ripples, width, height } = this.state;
		let { onPress, onGridPress, slowStart } = this.props;
		let sequential = this.value('sequential', 'rippleSequential')
		if (!sequential || !ripples.length) {
			if (typeof onPress === 'function') {
				// requestAnimationFrame(() => 
				onPress(event);
				// );
			}
			let { locationX=width/2, locationY=height/2 } = event.nativeEvent;
			// console.log({ locationX, locationY }, event.nativeEvent);
			let { grid, cellWidth, cellHeight } = _grid(this.props, this.state);
			if (grid && typeof onGridPress === 'function') {
				let column = Math.floor(locationX/cellWidth);
				let row = Math.floor(locationY/cellHeight);
				// requestAnimationFrame(() => 
				onGridPress(event, {row,column});
				// );
			}
			if (!slowStart) this.phases.push(this.startRipple(event));
		}
		// console.log(this.phases);
	}
	onLongPress = (event) => {
		let { width, height } = this.state;
		let { onLongPress, onGridLongPress, slowStart } = this.props;
		let { locationX=width/2, locationY=height/2 } = event.nativeEvent;
		let { grid, cellWidth, cellHeight } = _grid(this.props, this.state);
		if (typeof onLongPress === 'function') {
			// requestAnimationFrame(() => 
			onLongPress(event);
			// );
		} else {
			if (!slowStart) this.phases.push(this.startRipple(event));
		}
		if (grid && typeof onGridLongPress === 'function') {
			let column = Math.floor(locationX/cellWidth);
			let row = Math.floor(locationY/cellHeight);
			// requestAnimationFrame(() => 
			onGridLongPress(event, {row,column});
			// );
		}
	}
	onPressIn = (event) => {
		let { width, height } = this.state;
		let { onPressIn, slowStart, highlight, ghostSize, ghostDuration, ghostTimeout } = this.props;
		let { color, borderless, size, shifts, ghost } = _conf(this);
		// let { locationX=width/2, locationY=height/2 } = event.nativeEvent;
		// console.log('onPressIn', { locationX, locationY });
		if (typeof onPressIn === 'function') {
			onPressIn(event);
		}
		if(slowStart) this.phases.push(this.startRipple(event));
		// if(ghost) { // useless
		// 	let w2 = width/2, h2 = height/2, R = (ghostSize > 0 ? (0.5 * ghostSize) : Math.sqrt(Math.pow(w2, 2) + Math.pow(h2, 2)))
		// 	this.showGhost(R)
		// }
	}
	onPressOut = (event) => {
		let { width, height } = this.state;
		let { onPressOut, slowStart, cancelTolerance } = this.props;
		let { color, borderless, size, shifts, ghost } = _conf(this);
		let { locationX=width/2, locationY=height/2 } = event.nativeEvent;
		// console.log('onPressOu', { locationX, locationY });
		if (typeof onPressOut === 'function') {
			onPressOut(event);
		}
		let ripple, cancel;
		if (slowStart) {
			ripple = this.phases.shift();
			cancel = !!(Math.abs(locationX - ripple.locationX) > cancelTolerance || Math.abs(locationY - ripple.locationY) > cancelTolerance);
			if (cancel) {
				// console.log('Cancel riple');
				this.cancelRipple(ripple);
				return;
			}
			this.phaseRipple(event, ripple);
		}
		// if (slowStart) this.phaseRipple(event, ripple);
		// else if (ghost) this.hideGhost(ripple);
	}
	onAnimationEnd = () => {
		// console.log('onAnimationEnd');
		let { onPressOut, slowStart } = this.props;
		let { color, borderless, size, shifts, ghost } = _conf(this);
		if (slowStart) return;
		// else if (ghost) this.hideGhost(this.state.ripples[0]);
		else {
			let ripple = this.phases.shift();
			if (ghost) this.hideGhost(ripple, this.reduce);
		}
		if (!ghost) this.reduce();
	}
	reduce = () => {
		if (this.mounted) this.setState(({ ripples }) => ({ ripples: ripples.slice(1) }));
	}
	value = (name, alias, fallback) => {
		return (typeof this.props[alias] != 'undefined') ? this.props[alias] : (typeof this.props[name] != 'undefined') ? this.props[name] : fallback;
	}
	// showGhost = (R, callback) => { // useless
	// 	console.log('showGhost');
	// 	let { ghostDuration, ghostDelay } = this.props;
	// 	this.ghostScale.setValue(R/radius)
	// 	this.ghostAnim.stopAnimation(()=>{
	// 		Animated.timing(this.ghostAnim, {
	// 			toValue: 1,
	// 			duration: ghostDuration,
	// 			delay: ghostDelay,
	// 			easing: StandardCurve,
	// 			useNativeDriver: true,
	// 		}).start(callback);
	// 	});
	// }
	hideGhost = (ripple, callback=x=>x) => {
		// console.log('hideGhost');
		let duration = this.value('duration', 'rippleDuration');
		ripple.ghosting.stopAnimation(()=>{
			Animated.timing(ripple.ghosting, {
				toValue: 0,
				duration: duration/10,
				easing: StandardCurve,
				useNativeDriver: true,
			}).start(callback);
		});
	}
	renderGhost = ({ unique, progress, locationX, locationY, R, ghosting }, i) => {
		// console.log('renderGhost',i);
		let { width, height } = this.state;
		let {
			gridColumn, gridRow,
			// cellWidth, cellHeight,
			cellSize, cellBorderRadius, cellBorderless,
			ghostSize, ghostDuration, ghostColor, ghostOpacity, ghostDelay, ghostRestriction,
		} = this.props;
		let { color, borderless, size, shifts, ghost } = _conf(this);
		let w2 = width/2, h2 = height/2;
		let { grid, cellWidth, cellHeight } = _grid(this.props, this.state);
		let X, Y, x, y, r;
		ghostSize = ghostSize > 0 ? ghostSize : size > 0 && ghostRestriction ? size : ghostSize;
		if (grid) {
			X = Math.floor(locationX/cellWidth)*cellWidth;
			Y = Math.floor(locationY/cellHeight)*cellHeight;
			x = (cellBorderless ? X : 0) + cellWidth/2 - radius;
			y = (cellBorderless ? Y : 0) + cellHeight/2 - radius;
			r = (ghostSize > 0 ? (0.5 * ghostSize) : Math.sqrt(Math.pow(cellWidth/2, 2) + Math.pow(cellHeight/2, 2)));
		} else {
			x = w2 - radius;
			y = h2 - radius;
			r = (ghostSize > 0 ? (0.5 * ghostSize) : Math.sqrt(Math.pow(w2, 2) + Math.pow(h2, 2)));
		}
		// console.log(cellWidth, cellHeight, cellSize, R, r);
		let ghostStyle = {
			top: y,
			[I18nManager.isRTL ? 'right' : 'left']: x,
			backgroundColor: ghostColor,
			transform: [{
				scale: ghosting.interpolate({
					inputRange: [0, 0.001, 1],
					outputRange: [0, r/radius, r/radius],
				})
			}],
			opacity: (
				ghosting.interpolate({
					inputRange: [0, 1],
					outputRange: [0, ghostOpacity],
				})
			),
		};
		if (grid && !cellBorderless) {
			let boundStyle = {
				// overflow: 'hidden',
				[I18nManager.isRTL ? 'right' : 'left']: X,
				top: Y,
				borderRadius: cellBorderRadius,
				height: cellHeight,
				width: cellWidth,
			};
			return (
				<View pointerEvents='none' style={[styles.container, boundStyle]} key={unique} >
					<Animated.View pointerEvents='none' style={[styles.ripple, ghostStyle]} key={unique} />
				</View>
			);
		} else {
			return (
				<Animated.View pointerEvents='none' style={[styles.ripple, ghostStyle]} key={unique} />
			);
		}
	}
	renderRipple = ({ unique, progress, locationX, locationY, R, M, time }, i) => {
		// console.log('renderRipple',i);
		let { width, height } = this.state;
		let {
			centered, max,
			gridColumn, gridRow,
			// cellWidth, cellHeight,
			cellSize, cellBorderRadius, cellBorderless,
			morph, morphBorderRadius, morphDuration
		} = this.props;
		let opacity = this.value('opacity', 'rippleOpacity'),
			fades = this.value('fades', 'rippleFades');
		let { color, borderless, size, shifts, ghost } = _conf(this);
		let { grid, cellWidth, cellHeight } = _grid(this.props, this.state);
		if (grid) {
			// if (!shifts && centered) {
			// if (!shifts) {
			if (centered) {
				locationX = Math.floor(locationX/cellWidth)*cellWidth + cellWidth/2;
				locationY = Math.floor(locationY/cellHeight)*cellHeight + cellHeight/2;
			}
		} else {
			if (centered) {
				locationX = width/2;
				locationY = height/2;
			}
		}
		let X, Y, x, y;
		let w = (cellWidth > 0 ? cellWidth : width), h = (cellHeight > 0 ? cellHeight : height)
		let shiftX = (w/2)-(locationX%w), shiftY = (h/2)-(locationY%h);
		let morphs = _morphs(this.props, this.state, grid, size);
		let slowed = _slowed(this.props, ghost, R, M);
		// let finalOpacity = size > 0 ? 0 : opacity;
		let finalOpacity = (morphs || slowed) ? opacity : 0;
		let msX = (grid?cellWidth:width)/R/2//radius;
		let msY = (grid?cellHeight:height)/R/2//radius;
		let msR = morphBorderRadius/R*radius;
		// console.log('renderRipple', radius, locationX, locationY, offsetX, offsetY, cellWidth, cellHeight);
		// console.log('renderRipple', morphs, morph, ghost, size, R/radius, msX, msY, msR, msR*(R/radius), locationX, locationY);
		if (grid) {
			X = Math.floor(locationX/cellWidth)*cellWidth;
			Y = Math.floor(locationY/cellHeight)*cellHeight;
			x = (cellBorderless ? X : 0) + (locationX%cellWidth) - radius;
			y = (cellBorderless ? Y : 0) + (locationY%cellHeight) - radius;
		} else {
			x = locationX - radius;
			y = locationY - radius;
		}
		let l = locationX - radius*msX;
		let t = locationY - radius*msY;
		let L = !morphs ? x : progress.interpolate({
			inputRange: [0, 1, 1.05, 1.1],
			outputRange: [x, x, l, l],
		});
		let T = !morphs ? y : progress.interpolate({
			inputRange: [0, 1, 1.05, 1.1],
			outputRange: [y, y, t, t],
		});
		let transform = [
			{
				scale: progress.interpolate({
					inputRange: [0, 1, 2],
					outputRange: [0.5/radius, R/radius, R/radius],
				}),
			}
		];
		if(shifts) {
			transform.unshift({
				translateX: progress.interpolate({
					inputRange: [0, 1, 2],
					outputRange: [0, shiftX, shiftX],
				}),
			});
			transform.unshift({
				translateY: progress.interpolate({
					inputRange: [0, 1, 2],
					outputRange: [0, shiftY, shiftY],
				}),
			});
		}
		let style = {
			top: T,
			[I18nManager.isRTL ? 'right' : 'left']: L,
			backgroundColor: color,
			transform,
			opacity: (fades
				? progress.interpolate({
					inputRange: !morphs ? [0, 0.66, 1, 1.1] : [0, 0.66, 1, 1.033, 1.066, 1.1],
					outputRange: !morphs ? [opacity, opacity, finalOpacity, 0] : [opacity, opacity, finalOpacity, finalOpacity, finalOpacity, 0],
				})
				: opacity
			),
		};
		if (morphs) {
			style.width = progress.interpolate({
				inputRange: [0, 1, 1.05, 1.1],
				outputRange: [radius*2, radius*2, msX*radius*2, msX*radius*2],
			});
			style.height = progress.interpolate({
				inputRange: [0, 1, 1.05, 1.1],
				outputRange: [radius*2, radius*2, msY*radius*2, msY*radius*2],
			});
			style.borderRadius = progress.interpolate({
				inputRange: [0, 1, 1.05, 1.1],
				outputRange: [radius, radius, msR, msR],
			});
		}
		if (grid && !cellBorderless) {
			let boundStyle = {
				// overflow: 'hidden',
				[I18nManager.isRTL ? 'right' : 'left']: X,
				top: Y,
				borderRadius: cellBorderRadius,
				height: cellHeight,
				width: cellWidth,
			};
			return (
				<View pointerEvents='none' style={[styles.container, boundStyle]} key={unique} >
					<Animated.View pointerEvents='none' style={[styles.ripple, style]} key={unique} />
				</View>
			);
		} else {
			return (
				<Animated.View style={[styles.ripple, style]} key={unique} />
			);
		}
	}
	startRipple(event) {
		// console.log('startRipple');
		let { width, height } = this.state;
		let {
			onRippleAnimation,
			// cellWidth, cellHeight,
			cellSize,
			cellBorderless,
			slowStart,
			slowDuration,
			ghostDuration,
			ghostDelay,
			highlight,
			morph,
			max,
		} = this.props;
		let duration = this.value('duration', 'rippleDuration'),
			centered = this.value('centered', 'rippleCentered');
		let { color, borderless, size, shifts, ghost } = _conf(this);
		let { grid, cellWidth, cellHeight } = _grid(this.props, this.state);
		let morphs = _morphs(this.props, this.state, grid, size);
		let w2 = 0.5 * width;
		let h2 = 0.5 * height;
		let { locationX=width/2, locationY=height/2 } =  event.nativeEvent;
		let offsetX = Math.abs(w2 - locationX);
		let offsetY = Math.abs(h2 - locationY);
		let M = Math.sqrt(Math.pow(w2, 2) + Math.pow(h2, 2))
		let R = shifts
			? (size > 0 ? (0.5 * size) : M)
			: (size > 0 ? (0.5 * size) : Math.sqrt(Math.pow(w2 + offsetX, 2) + Math.pow(h2 + offsetY, 2)));

		if(grid) {
			let W = cellWidth/2;
			let H = cellHeight/2;
			let X = locationX%cellWidth;
			let Y = locationY%cellHeight;
			R = size > 0
				? (0.5 * size)
				: (!cellBorderless && !(shifts || centered))
					? Math.sqrt(Math.pow(W + Math.abs(W - X), 2) + Math.pow(H + Math.abs(H - Y), 2))
					: Math.sqrt(Math.pow(W, 2) + Math.pow(H, 2));//(0.5 * 1.4142 * cellSize);
		}
		R = Math.min(R, max/2);
		// console.log(cellWidth, cellHeight, cellSize, R, Math.sqrt(Math.pow(cellWidth/2, 2) + Math.pow(cellHeight/2, 2)));

		let ripple = {
			time: Date.now(),
			unique: this.unique++,
			progress: new Animated.Value(0),
			ghosting: new Animated.Value(0),
			locationX,
			locationY,
			R,
			M,
		};

		let animation = ripple.animation = Animated
			.timing(ripple.progress, {
				toValue: 1,//slowStart ? 1 : 2,//
				duration: slowStart ? 2*slowDuration : 2*duration,
				easing: slowStart ? LinearMotion : StandardCurve,
				useNativeDriver: !morphs,
			});
		let ghostAnim = ripple.ghostAnim = Animated
			.timing(ripple.ghosting, {
				toValue: 1,
				duration: ghostDuration,
				delay: highlight ? 0 : ghostDelay,
				easing: StandardCurve,
				useNativeDriver: true,
			});
		let parallel = Animated.parallel([animation, ghostAnim], {stopTogether:false});
		onRippleAnimation(parallel, this.onAnimationEnd);
		this.setState(({ ripples }) => ({ ripples: ripples.concat(ripple) }));
		return ripple;
	}
	phaseRipple(event, ripple) {
		// console.log('phaseRipple');
		let { width, height } = this.state;
		let {
			onRippleAnimation,
			slowStart,
			slowDuration,
			morph,
			morphDuration,
			highlight,
		} = this.props;
		let duration = this.value('duration', 'rippleDuration'),
			centered = this.value('centered', 'rippleCentered');
		let { color, borderless, size, shifts, ghost } = _conf(this);
		let { grid } = _grid(this.props, this.state);
		let morphs = _morphs(this.props, this.state, grid, size);
		let slowed = _slowed(this.props, ghost, ripple.R, ripple.M);
		let passed = Date.now() - ripple.time;
		let percent = 1 - (passed/slowDuration)
		let tym1 = passed>=slowDuration+100?0:duration
		let tym2 = Math.max(0, tym1-10-duration/10)

		let animation = Animated
			.timing(ripple.progress, {
				toValue: 1,
				duration: tym1,//(1+(1/percent))*duration,//duration - (Date.now() - ripple.time),//
				easing: DeceleratedCurve,
				useNativeDriver: !morphs,
			});
		let ghostAnim = ripple.ghostAnim = Animated
			.timing(ripple.ghosting, {
				toValue: 0,
				duration: duration/10,
				delay: (highlight || slowed) ? 0 : tym2,
				easing: DeceleratedCurve,
				useNativeDriver: true,
			});

		ripple.animation.stop();
		if(!highlight) ripple.ghostAnim.stop();
		let set1 = (highlight || slowed) ? animation : Animated.parallel([animation, ghostAnim], {stopTogether:false});
		// console.log(set1);
		set1.start(() => {
			if(highlight) ripple.ghostAnim.stop();
			let anim = Animated
				.timing(ripple.progress, {
					toValue: 1.1,
					duration: morphs?morphDuration:duration/10,
					easing: DeceleratedCurve,
					useNativeDriver: !morphs,
				});
			let set2 = (highlight || slowed) ? Animated.parallel([anim, ghostAnim], {stopTogether:false}) : anim;
			set2.start(this.reduce);
		});
	}
	cancelRipple(ripple) {
		let {
			cancelAnimated,
			cancelDuration,
		} = this.props;
		let { color, borderless, size, shifts, ghost } = _conf(this);
		let { grid } = _grid(this.props, this.state);
		let morphs = _morphs(this.props, this.state, grid, size);
		ripple.animation.stop();
		ripple.ghostAnim.stop();
		if (!cancelAnimated) {
			if (this.mounted) this.setState(({ ripples }) => ({ ripples: ripples.filter(r => (r.time != ripple.time)) }));
			return;
		}
		let duration = cancelDuration > 0 ? cancelDuration : Date.now() - ripple.time;
		let anim = Animated
			.timing(ripple.progress, {
				toValue: 0,
				duration: duration,
				easing: DeceleratedCurve,
				useNativeDriver: !morphs,
			});
		let ghostAnim = Animated
			.timing(ripple.ghosting, {
				toValue: 0,
				duration: duration,
				easing: DeceleratedCurve,
				useNativeDriver: true,
			});
		let parallel = Animated.parallel([anim, ghostAnim], {stopTogether:false});
		parallel.start(() => {
			if (this.mounted) this.setState(({ ripples }) => ({ ripples: ripples.filter(r => (r.time != ripple.time)) }));
		});
	}
	render() {
		let { ripples } = this.state;
		let {
			delayLongPress,
			delayPressIn,
			delayPressOut,
			disabled,
			hitSlop,
			pressRetentionOffset,
			children,
			testID,
			nativeID,
			accessible,
			accessibilityHint,
			accessibilityLabel,
			
			onPress,
			onLongPress,
			onLayout,
			onRippleAnimation,
			onGridPress,
			onGridLongPress,
			
			color,
			opacity,
			duration,
			size,
			containerBorderRadius,
			centered,
			sequential,
			fades,
			// disabled,
			
			max,
			cellSize,
			cellWidth,
			cellHeight,
			gridColumn,
			gridRow,
			cellBorderless,
			cellBorderRadius,
			cancelTolerance,
			cancelDuration,
			cancelAnimated,
			shifts,
			highlight,
			ghost,
			ghostRestriction,
			ghostSize,
			ghostColor,
			ghostFades,
			ghostOpacity,
			ghostDuration,
			ghostDelay,
			ghostUseForeground,
			slowStart,
			slowDuration,
			morph,
			morphBorderRadius,
			morphDuration,
			borderless,
			useForeground,
			background,
			containerStyle,
			
			...props
		} = this.props;
		let touchableProps = {
			delayLongPress,
			delayPressIn,
			delayPressOut,
			disabled,
			hitSlop,
			pressRetentionOffset,
			testID,
			accessible,
			accessibilityHint,
			accessibilityLabel,
			onLayout: this.onLayout,
			onPress: this.onPress,
			onPressIn: this.onPressIn,
			onPressOut: this.onPressOut,
			onLongPress: (onLongPress
				? this.onLongPress
				: undefined
			),
			...('web' !== Platform.OS ? { nativeID } : null),
		};
		// let { color, borderless, size, shifts, ghost } = _conf(this);
		let conf = _conf(this);
		containerBorderRadius = this.value('containerBorderRadius', 'rippleContainerBorderRadius');
		borderless = conf.borderless;
		ghost = conf.ghost;
		
		let wrapStyle = {
			borderRadius: containerBorderRadius,
			overflow: borderless?'visible':'hidden',
		};

		return (
			<TouchableWithoutFeedback {...touchableProps}>
				<Animated.View {...props} pointerEvents={'box-only'} style={containerStyle}>
					{ghost && !ghostUseForeground && <View style={[styles.container, wrapStyle]}>{ripples.map(this.renderGhost)}</View>}
					{!!useForeground && children}
					{ghost && !!ghostUseForeground && <View style={[styles.container, wrapStyle]}>{ripples.map(this.renderGhost)}</View>}
					<View style={[styles.container, wrapStyle]}>
						{ripples.map(this.renderRipple)}
					</View>
					{!useForeground && children}
				</Animated.View>
			</TouchableWithoutFeedback>
		);
	}
}