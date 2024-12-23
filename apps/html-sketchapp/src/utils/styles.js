// Convert kebab-case CSS properties to camelCase
function toCamelCase(prop) {
  return prop.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

// Reconstruct shorthand properties from their four sides if applicable
function addShorthands(styles) {
  // Margin
  if (
    "marginTop" in styles &&
    "marginRight" in styles &&
    "marginBottom" in styles &&
    "marginLeft" in styles
  ) {
    const mt = styles.marginTop;
    const mr = styles.marginRight;
    const mb = styles.marginBottom;
    const ml = styles.marginLeft;
    // If top/bottom are equal and left/right are equal, form a shorthand
    if (mt === mb && ml === mr) {
      styles.margin = mt === mb && mt === mr ? mt : `${mt} ${mr}`;
    } else {
      // At least a top/bottom and left/right might form a pattern
      // If not symmetrical, fallback to a four-value margin:
      styles.margin = `${mt} ${mr} ${mb} ${ml}`;
    }
  }

  // Padding
  if (
    "paddingTop" in styles &&
    "paddingRight" in styles &&
    "paddingBottom" in styles &&
    "paddingLeft" in styles
  ) {
    const pt = styles.paddingTop;
    const pr = styles.paddingRight;
    const pb = styles.paddingBottom;
    const pl = styles.paddingLeft;
    if (pt === pb && pl === pr) {
      styles.padding = pt === pb && pt === pr ? pt : `${pt} ${pr}`;
    } else {
      styles.padding = `${pt} ${pr} ${pb} ${pl}`;
    }
  }

  // Border Width
  if (
    "borderTopWidth" in styles &&
    "borderRightWidth" in styles &&
    "borderBottomWidth" in styles &&
    "borderLeftWidth" in styles
  ) {
    const btw = styles.borderTopWidth;
    const brw = styles.borderRightWidth;
    const bbw = styles.borderBottomWidth;
    const blw = styles.borderLeftWidth;
    if (btw === bbw && blw === brw) {
      styles.borderWidth = btw === bbw && btw === brw ? btw : `${btw} ${brw}`;
    } else {
      styles.borderWidth = `${btw} ${brw} ${bbw} ${blw}`;
    }
  }

  // Border Style
  if (
    "borderTopStyle" in styles &&
    "borderRightStyle" in styles &&
    "borderBottomStyle" in styles &&
    "borderLeftStyle" in styles
  ) {
    const bts = styles.borderTopStyle;
    const brs = styles.borderRightStyle;
    const bbs = styles.borderBottomStyle;
    const bls = styles.borderLeftStyle;
    if (bts === bbs && bls === brs) {
      styles.borderStyle = bts === bbs && bts === brs ? bts : `${bts} ${brs}`;
    } else {
      styles.borderStyle = `${bts} ${brs} ${bbs} ${bls}`;
    }
  }

  // Border Color
  if (
    "borderTopColor" in styles &&
    "borderRightColor" in styles &&
    "borderBottomColor" in styles &&
    "borderLeftColor" in styles
  ) {
    const btc = styles.borderTopColor;
    const brc = styles.borderRightColor;
    const bbc = styles.borderBottomColor;
    const blc = styles.borderLeftColor;
    if (btc === bbc && blc === brc) {
      styles.borderColor = btc === bbc && btc === brc ? btc : `${btc} ${brc}`;
    } else {
      styles.borderColor = `${btc} ${brc} ${bbc} ${blc}`;
    }
  }

  // Border Radius
  if (
    "borderTopLeftRadius" in styles &&
    "borderTopRightRadius" in styles &&
    "borderBottomRightRadius" in styles &&
    "borderBottomLeftRadius" in styles
  ) {
    const tlr = styles.borderTopLeftRadius;
    const trr = styles.borderTopRightRadius;
    const brr = styles.borderBottomRightRadius;
    const blr = styles.borderBottomLeftRadius;
    // If all four corners are same:
    if (tlr === trr && trr === brr && brr === blr) {
      styles.borderRadius = tlr;
    } else {
      // We won't combine into shorter forms; snippet shows all four anyway.
      // If needed, we could form a shorthand, but snippet shows them individually.
    }
  }
}

function formatBoxShadow(val) {
  if (!val || val === "none") return "";
  const firstShadow = val.split(",")[0].trim().split(/\s+/);
  let colorPart = "";
  const offsets = [];
  for (let i = 0; i < firstShadow.length; i++) {
    if (firstShadow[i].includes("rgb")) {
      colorPart = firstShadow[i];
    } else {
      offsets.push(firstShadow[i]);
    }
  }
  if (!colorPart) return "";
  if (offsets.length < 3) return "";
  if (offsets.length === 3) offsets.push("0px");
  return [colorPart, offsets.join(" ")].join(" ");
}

function extractAllStyles(el) {
  const computedStyle = window.getComputedStyle(el);
  const styles = {};
  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle.item(i);
    let val = computedStyle.getPropertyValue(prop);
    if (prop === "box-shadow" && val && val !== "none") {
      val = formatBoxShadow(val);
    }

    // Convert to camelCase
    const camelProp = toCamelCase(prop);

    // Keep only non-empty and non-null
    if (val != null && val !== "") {
      // Attempt to quote fontFamily if it contains spaces
      if (camelProp === "fontFamily" && val && !val.startsWith('"')) {
        if (val.indexOf(" ") > -1 || val.indexOf(",") > -1) {
          // Wrap entire fontFamily in quotes to mimic snippet formatting
          val = `"${val}"`;
        }
      }

      styles[camelProp] = val;
    }
  }

  // Reconstruct common shorthands if possible
  addShorthands(styles);
  return styles;
}

module.exports = {
  toCamelCase,
  addShorthands,
  formatBoxShadow,
  extractAllStyles,
};
