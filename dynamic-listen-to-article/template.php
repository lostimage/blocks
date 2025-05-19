<?php
/**
 * Listen to Article Block Template.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @package Moniify
 */

/* Block level classes and styles */

use Moniify\Components\SVG;

$wrapper_attributes = get_block_wrapper_attributes();

/* Get Allowed Tags */
$allowed_tags = allowed_tags();

$audio_source   = $attributes['audioSource'] ?? 'upload';
$audio_url      = '';
$audio_title    = $attributes['audioTitle'] ?? '';
$estimated_time = $attributes['estimatedTime'] ?? '0:00';

if ( 'meta' === $audio_source ) {
	$audio_post_id = get_the_ID();
	$audio_id      = get_post_meta( $audio_post_id, 'audio_file', true );
	if ( $audio_id ) {
		$audio_url = wp_get_attachment_url( $audio_id );
		if ( empty( $audio_title ) ) {
			$audio_title = get_the_title( $audio_post_id );
		}
		$estimated_time = get_post_meta( $audio_post_id, 'audio_estimated_listening_time', true ) ?: '0:00'; // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
	}
} else {
	$audio_url = $attributes['audioUrl'] ?? '';
}

if ( empty( $audio_url ) ) {
	?>
	<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<p class="bn-text-[var(--text-primary)]"><?php esc_html_e( 'No audio file available.', 'moniify' ); ?></p>
	</div>
	<?php
	return;
}
$audio_bg     = 'bn-bg-[var(--bg-primary)]';
$border_color = 'bn-border-[var(--border-tertiary)]';
$text_primary = 'bn-text-[var(--text-primary)]';
$text_time    = 'bn-text-[var(--text-tertiary)]';
$bg_tertiary  = 'bn-bg-[var(--bg-tertiary)]';
$btn_styles   = 'bn-bg-[var(--bg-quaternary)] bn-border-[var(--border-tertiary)] bn-text-[var(--fg-primary)] hover:bn-border-[var(--border-brand)] hover:bn-text-[var(--bg-brand-solid)]';

?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="bn-flex bn-p-3 bn-gap-3 bn-border <?php echo esc_attr( $audio_bg ); ?> <?php echo esc_attr( $border_color ); ?> bn-rounded-[12px] w-full">
		<audio class="audio-player" src="<?php echo esc_url( $audio_url ); ?>" preload="metadata" loop></audio>
		<button class="bn-play-audio <?php echo esc_attr( $btn_styles ); ?> bn-flex bn-justify-center bn-items-center bn-border bn-w-12 bn-h-12 bn-rounded-full bn-fs-0">
			<span class="play-icon">
			<?php
			SVG::get_instance()->render_svg(
				'assets/svg/icon-play-icon.svg',
				[
					'class' => 'play-icon ',
				],
			);
			?>
			</span>
			<span class="pause-icon bn-hidden">
			<?php
				SVG::get_instance()->render_svg(
					'assets/svg/icon-pause-icon.svg',
					[
						'class' => 'pause-icon',
					],
				);
				?>
			</span>
		</button>
		<div class="bn-flex-grow">
			<div class="bn-flex bn-justify-between bn-items-center bn-pb-2 bn-w-full bn-flex-wrap">
				<p class="<?php echo esc_attr( $text_primary ); ?> bn-font-semibold bn-text-[14px]"><?php echo esc_html( $audio_title ); ?></p>
				<div class="bn-flex bn-items-center bn-gap-2">
					<div class="bn-play-audio__track-btns bn-flex bn-gap-[4px]">
						<button class="rewind-play <?php echo esc_attr( $text_primary ); ?>">
							<?php
							SVG::get_instance()->render_svg(
								'assets/svg/icon-rewind.svg',
								[
									'class' => 'play-icon',
								],
							);
							?>
						</button>
						<button class="forward-play <?php echo esc_attr( $text_primary ); ?>">
							<?php
							SVG::get_instance()->render_svg(
								'assets/svg/icon-forward.svg',
								[
									'class' => 'play-icon',
								],
							);
							?>
						</button>
					</div>
					<button class="<?php echo esc_attr( $bg_tertiary ); ?> rate-button bn-font-semibold bn-text-wp-x-small bn-px-2 bn-pl-[8px] bn-pr-[8px] bn-text-[var(--text-secondary)] bn-rounded-[32px]">1x</button>
				</div>
			</div>
			<div class="bn-flex bn-gap-3 bn-justify-between bn-items-center bn-w-full">
				<span id="current-time" class="<?php echo esc_attr( $text_time ); ?> bn-text-wp-x-small bn-font-medium bn-shrink-0">0:00</span>
				<input type="range" class="audio-slider-range bn-border-none" max="100" value="0" />
				<span id="duration" class="<?php echo esc_attr( $text_time ); ?> bn-text-wp-x-small bn-font-medium bn-shrink-0 bn-text-[var(--wp--preset--color--theme-5)]"><?php echo esc_html( $estimated_time ); ?></span>
			</div>
		</div>
	</div>
</div>
