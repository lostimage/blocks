<?php
/**
 * Plugin Name:       Shorts
 * Description:       Block for shorts
 * Requires at least: 6.6
 * Requires PHP:      7.2
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       short-reels
 *
 * @package ShortReels
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Render callback for the block.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 * @return string Rendered block output.
 */
function render_short_reels_block( $attributes = [], $content = '', $block = null ) {
	ob_start();
	$args = [
		'attributes' => $attributes,
		'content'    => $content,
		'block'      => $block,
	];
	require plugin_dir_path( __FILE__ ) . 'build/render.php';
	return ob_get_clean();
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 */
function short_reels_short_reels_block_init() {
	register_block_type(
		__DIR__ . '/build',
		[
			'render_callback' => 'render_short_reels_block',
		]
	);
}
add_action( 'init', 'short_reels_short_reels_block_init' );
