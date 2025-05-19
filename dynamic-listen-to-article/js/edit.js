/**
 * WordPress dependencies
 */
import { useBlockProps, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Button, TextControl, PanelBody, SelectControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PlayIcon, ForwardIcon, RewindIcon, PauseIcon } from './icons';

export default function Edit( props ) {
	const { attributes, setAttributes } = props;
	const { audioUrl, estimatedTime = '', audioId, audioTitle = '', audioSource } = attributes;
	const [ audioDuration, setAudioDuration ] = useState( '' );
	const [ playState, setPlayState ] = useState( 'play' );
	const [ currentTime, setCurrentTime ] = useState( 0 );
	const [ playbackRate, setPlaybackRate ] = useState( 1 );
	const audioRef = useRef( null );
	const blockProps = useBlockProps();

	const { getEditedPostAttribute } = useSelect( ( select ) => select( editorStore ) );
	const postMeta = getEditedPostAttribute( 'meta' );

	useEffect( () => {
		if ( audioSource === 'meta' && postMeta && postMeta.audio_url ) {
			setAttributes( { audioUrl: postMeta.audio_url } );
		}
	}, [ audioSource, postMeta, setAttributes ] );

	useEffect( () => {
		if ( audioUrl ) {
			const audio = audioRef.current;
			const updateDuration = () => {
				const duration = audio.duration;
				const minutes = Math.floor( duration / 60 );
				const seconds = Math.floor( duration % 60 );
				const formattedDuration = `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
				setAudioDuration( formattedDuration );
				setAttributes( { estimatedTime: formattedDuration } );
			};

			audio.addEventListener( 'loadedmetadata', updateDuration );

			return () => {
				audio.removeEventListener( 'loadedmetadata', updateDuration );
			};
		}
	}, [ audioUrl, setAttributes ] );

	const handlePlayPause = () => {
		const audio = audioRef.current;
		if ( playState === 'play' ) {
			audio.play();
			setPlayState( 'pause' );
		} else {
			audio.pause();
			setPlayState( 'play' );
		}
	};

	const handleTimeUpdate = () => {
		const audio = audioRef.current;
		setCurrentTime( Math.floor( audio.currentTime ) );
	};

	const handleSeek = ( event ) => {
		const audio = audioRef.current;
		audio.currentTime = event.target.value;
		setCurrentTime( audio.currentTime );
	};

	const handlePlaybackRateChange = () => {
		const audio = audioRef.current;
		let newRate = 1;
		if ( playbackRate === 1 ) {
			newRate = 1.5;
		} else if ( playbackRate === 1.5 ) {
			newRate = 2;
		} else {
			newRate = 1;
		}
		audio.playbackRate = newRate;
		setPlaybackRate( newRate );
	};

	const handleForward = () => {
		const audio = audioRef.current;
		audio.currentTime = Math.min( audio.currentTime + 10, audio.duration );
		setCurrentTime( audio.currentTime );
	};

	const handleBackward = () => {
		const audio = audioRef.current;
		audio.currentTime = Math.max( audio.currentTime - 10, 0 );
		setCurrentTime( audio.currentTime );
	};

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Audio Settings', 'moniify' ) }>
					<SelectControl
						label={ __( 'Audio Source', 'moniify' ) }
						value={ audioSource }
						options={ [
							{ label: __( 'Upload', 'moniify' ), value: 'upload' },
							{ label: __( 'Meta Field', 'moniify' ), value: 'meta' },
						] }
						onChange={ ( value ) => setAttributes( { audioSource: value } ) }
					/>
					<TextControl
						label={ __( 'Audio Title', 'moniify' ) }
						value={ audioTitle }
						onChange={ ( value ) => setAttributes( { audioTitle: value } ) }
					/>
					<TextControl
						label={ __( 'Estimated Time', 'moniify' ) }
						value={ estimatedTime }
						onChange={ ( value ) => setAttributes( { estimatedTime: value } ) }
					/>
				</PanelBody>
			</InspectorControls>

			{ audioSource === 'upload' && (
				<MediaUploadCheck>
					<MediaUpload
						onSelect={ ( media ) => setAttributes( { audioUrl: media.url, audioId: media.id } ) }
						allowedTypes={ [ 'audio' ] }
						value={ audioId }
						render={ ( { open } ) => (
							<Button onClick={ open } variant="secondary">
								{ audioUrl ? __( 'Replace Audio', 'moniify' ) : __( 'Select Audio', 'moniify' ) }
							</Button>
						) }
					/>
				</MediaUploadCheck>
			) }

			<div className="bn-flex bn-p-4 bn-gap-4 bn-border bn-border-border-secondary bn-rounded-[4px] w-full">
				<audio
					ref={ audioRef }
					src={ audioUrl }
					preload="metadata"
					loop
					onTimeUpdate={ handleTimeUpdate }
				></audio>
				<button
					className="bn-play-audio bn-flex bn-justify-center bn-items-center bn-border bn-w-12 bn-h-12 bn-border-border-primary bn-rounded-full"
					onClick={ handlePlayPause }
				>
					{ playState === 'play' ? <PlayIcon /> : <PauseIcon /> }
				</button>
				<div className="bn-flex-grow">
					<div className="bn-flex bn-justify-between bn-items-center bn-pb-2 bn-w-full">
						<p className="bn-text-theme-2 bn-font-semibold bn-text-base">{ audioTitle }</p>
						<div className="bn-flex bn-items-center bn-gap-2">
							<button onClick={ handleBackward }><RewindIcon /></button>
							<button onClick={ handleForward }><ForwardIcon /></button>
							<button
								className="bn-bg-border-tertiary bn-font-semibold bn-text-wp-x-small bn-px-2 bn-text-theme-4 bn-rounded-[32px]"
								onClick={ handlePlaybackRateChange }
							>
								{ playbackRate.toFixed( 1 ) }x
							</button>
						</div>
					</div>
					<div className="bn-flex bn-gap-3 bn-justify-between bn-items-center bn-w-full">
						<span id="current-time" className="bn-text-theme-4 bn-shrink-0 bn-text-wp-x-small bn-font-medium">
							{ Math.floor( currentTime / 60 ) }:{ ( currentTime % 60 ).toString().padStart( 2, '0' ) }
						</span>
						<input
							type="range"
							className="audio-slider-range bn-border-none"
							max={ audioRef.current ? audioRef.current.duration : 100 }
							value={ currentTime }
							onChange={ handleSeek }
						/>
						<span id="duration" className="bn-text-theme-4 bn-shrink-0 bn-text-wp-x-small bn-font-medium">
							{ audioDuration }
						</span>
					</div>
				</div>
			</div>

		</div>
	);
}
