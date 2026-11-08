/*
 * Usage:
 *
 * <<doubleslider VAR1 VAR2 VAR3 LEFTCOLOR MIDDLECOLOR RIGHTCOLOR>>
 *
 * Variable names may be passed with or without the "$" sigil (e.g. "mhermchance" or
 * "$settings.maleNPCVaginaChance"). Dotted property paths like "$settings.foo" are supported
 * via Wikifier.getValue/setValue.
 *
 * The colors can be any css-compatible colour string, like "#00FF00" or "rgb(0,255,0)".
 *
 * Additional macros, or additional arguments, can be implemented to allow for different skins or different presentation styles.
 *
 * The current "doubleslider" macro creates a range from 0 to 100, with two sliders and three labels. The player moves the sliders to set the values of three variables,
 * which will add up to a total of 100%. The three variables are visually represented as the spaces between the sliders.
 */
Macro.add("doubleslider", {
	handler() {
		let [var1, var2, var3, leftcolor, middlecolor, rightcolor] = this.args;
		if (this.args.length % 3 !== 0) throw new Error("Bad doubleslider args " + JSON.stringify(this.args));
		if (this.args.length === 3) {
			// defaults
			leftcolor = "#fa0000";
			middlecolor = "#ab00fa";
			rightcolor = "#006cfa";
		}
		// Normalize variable name: prepend "$" sigil if not already present, for Wikifier path resolution.
		// This allows callers to pass either bare names ("mhermchance") or full paths ("$settings.maleNPCVaginaChance").
		const sigil = v => (v.startsWith("$") || v.startsWith("_") ? v : "$" + v);
		// Derive element ID from variable name (strip leading sigil if present)
		const elemId = v => (v.startsWith("$") || v.startsWith("_") ? v.slice(1) : v);

		function updateValues(data, where) {
			// console.log("updateValues from " + where);

			let bar2 = data.slider.find(".irs-bar2");
			if (bar2.length === 0) bar2 = $("<span>").addClass("irs-bar2").appendTo(data.slider);
			bar2.css("width", "" + (data.from / (data.max - data.min)) * 100 + "%");

			const middleLabel = data.slider.find(".irs-single");
			const rightLabel = data.slider.find(".irs-to");
			const leftLabel = data.slider.find(".irs-from");

			// label visibility mod
			leftLabel.css("visibility", "visible");
			if (data.from <= 0) leftLabel.css("visibility", "hidden");

			middleLabel.css("visibility", "visible");
			if (data.to - data.from <= 0) middleLabel.css("visibility", "hidden");

			rightLabel.css("visibility", "visible");
			if (100 - data.to <= 0) rightLabel.css("visibility", "hidden");

			// set the label content
			middleLabel.html(Wikifier.getValue(sigil(var2)) + "%");
			rightLabel.html(Wikifier.getValue(sigil(var3)) + "%");

			// set the label positions to be centred on the bars
			const a = data.max - data.min;
			const midbar = data.slider.find(".irs-bar");

			leftLabel.css("left", "calc(" + (data.from / a) * 50 + "% - " + leftLabel.width() / 2 + "px)");
			middleLabel.css("left", "calc(" + ((data.from / a) * 100 + midbar.width() / 8) + "% - " + middleLabel.width() / 2 + "px)");
			rightLabel.css("left", "calc(" + (data.to + (100 - data.to) / 2) + "% - " + rightLabel.width() / 2 + "px)");
		}

		const input = $("<input>") /* create new element and wrap in jQuery */
			.appendTo(this.output) /* 'output' is document fragment to be appended to current passage */
			.ionRangeSlider({
				type: "double",
				skin: "roundprobability",
				drag_interval: true,
				hide_min_max: true,
				postfix: "%",
				min: 0,
				max: 100,
				from: Wikifier.getValue(sigil(var1)),
				to: 100 - Wikifier.getValue(sigil(var3)),
				onStart(data) {
					// let uniqueId = data.slider[0].classList[2];	//ensures that multiple sliders don't interfere with each other.

					updateValues(data, "onStart");

					data.slider.find(".irs-handle.from").css("--color", leftcolor);
					data.slider.find(".irs-from").css("--color", leftcolor);
					data.slider.find(".irs-bar2").css("--color", leftcolor);

					data.slider.find(".irs-handle.single").css("--color", middlecolor);
					data.slider.find(".irs-single").css("--color", middlecolor);
					data.slider.find(".irs-bar").css("--color", middlecolor);

					data.slider.find(".irs-handle.to").css("--color", rightcolor);
					data.slider.find(".irs-to").css("--color", rightcolor);
					data.slider.find(".irs-line").css("--color", rightcolor);
				},
				onChange(data) {
					// set the variables
					Wikifier.setValue(sigil(var1), data.from);
					Wikifier.setValue(sigil(var2), data.to - data.from);
					Wikifier.setValue(sigil(var3), 100 - data.to);
					// update the page to tell the user what the variables are
					jQuery("#numberslider-value-" + elemId(var1)).text(data.from);
					jQuery("#numberslider-value-" + elemId(var2)).text(data.to - data.from);
					jQuery("#numberslider-value-" + elemId(var3)).text(100 - data.to);

					// updateValues(data, "onChange");
				},
			});
		const slider = input.data("ionRangeSlider");
		const oldDrawHandles = slider.drawHandles;
		slider.drawHandles = function () {
			oldDrawHandles.call(this);
			updateValues(this.result, "drawHandles");
		};
		slider.callOnChange();
	},
});
