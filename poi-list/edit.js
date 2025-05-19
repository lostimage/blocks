import {useRef, useEffect, useState} from '@wordpress/element';
import {useBlockProps, InspectorControls} from '@wordpress/block-editor';
import {PanelBody, ComboboxControl, Button, SelectControl, RangeControl} from '@wordpress/components';
import Sortable from 'gutenberg-sortable';
import apiFetch from '@wordpress/api-fetch';
import './editor.scss';
import mapPlaceholder from '../../assets/img/map-placeholder.jpg';
import poiPlaceholder from '../../assets/img/poi-placeholder.jpg';

export default function Edit({attributes, setAttributes, clientId}) {
    const {selectedPostType, highlightedPOIs} = attributes;

    const inputContainer = useRef();
    const [posts, setPosts] = useState([]);
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    const postTypes = [
        {label: 'Campsites', value: 'campsites'},
        {label: 'F-Roads', value: 'f-roads'},
        {label: 'Hot Springs', value: 'hot-springs'}
    ];

    useEffect(() => {
        fetchPosts(selectedPostType);
    }, [selectedPostType]);

    const fetchPosts = (postType) => {
        setLoading(true);
        apiFetch({
            path: `/wp/v2/${postType}?per_page=100`,
        })
            .then((data) => {
                setPosts(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching data:', error);
                setLoading(false);
            });

        apiFetch({
            path: `/wp/v2/${postType}?per_page=9&orderby=date&order=desc`,
        })
            .then((data) => {
                setRecentPosts(data);
            })
            .catch((error) => {
                console.error('Error fetching recent data:', error);
            });
    };

    const handlePostTypeChange = (value) => {
        setAttributes({
            selectedPostType: value,
            highlightedPOIs: []
        });
    };

    // Update to only filter out highlightedPOIs
    const availablePosts = Array.isArray(posts)
        ? posts.filter((item) => highlightedPOIs.indexOf(item.id) === -1)
        : [];

    const onSelectHighlightedPOIChange = (postId) => {
        if (postId) {
            setAttributes({
                highlightedPOIs: highlightedPOIs
                    ? [...highlightedPOIs, parseInt(postId)]
                    : [parseInt(postId)],
            });
        }
    };

    const onHighlightedPOIsSortEnd = (items) => {
        setAttributes({highlightedPOIs: items});
    };

    const handleRemoveHighlightedPOI = (postId) => {
        setAttributes({
            highlightedPOIs: highlightedPOIs.filter((item) => item !== postId),
        });
    };

    const getPost = (postId) => {
        if (postId && posts && Array.isArray(posts)) {
            return posts.find((item) => item.id === postId);
        }
        return null;
    };

    // Updated renderPOIs function to combine highlighted and recent
    const renderPOIs = () => {
        // Get highlighted POIs
        const highlightedItems = highlightedPOIs.map(poiId => {
            const post = getPost(poiId);
            if (!post) return null;

            return {
                id: poiId,
                title: post.title?.rendered || 'Untitled',
                isHighlighted: true
            };
        }).filter(Boolean);

        const recentItems = recentPosts
            .filter(post => !highlightedPOIs.includes(post.id))
            .map(post => ({
                id: post.id,
                title: post.title?.rendered || 'Untitled',
                isHighlighted: false
            }));

        // Combine both lists, with highlighted first
        const allItems = [...highlightedItems, ...recentItems].slice(0, 10);

        return allItems.map((item, i) => (
            <article key={i} className={`itm-poi-card ${item.isHighlighted ? 'itm-poi-highlighted' : ''}`}>
                <div className="itm-poi-card__image">
                    <img src={poiPlaceholder} alt=""/>
                </div>
                <div className="itm-poi-card__content">
                    <h5 className="itm-poi-card__title">
                        {item.title}
                    </h5>
                    {item.isHighlighted && (
                        <span className="itm-poi-card__highlight-badge">Featured</span>
                    )}
                </div>
            </article>
        ));
    };

    const renderPOIContent = () => {
        if (loading) {
            return (
                <p className="text-center" style={{padding: '30px'}}>Loading POIs...</p>
            );
        }

        if (highlightedPOIs.length === 0 && recentPosts.length === 0) {
            return (
                <p
                    className="text-center"
                    style={{
                        padding: '30px',
                        background: '#f3f4f5',
                        border: '1px dashed #ccc',
                    }}
                >
                    No POIs available. You can add featured POIs in the block settings.
                </p>
            );
        }

        return (
            <div className="itm-home-poi__content">
                <div className="itm-home-poi__map">
                    <img src={mapPlaceholder} alt="Map Placeholder"/>
                </div>
                <div className="itm-home-poi__cards">
                    {renderPOIs()}
                </div>
            </div>
        );
    };


    const blockProps = useBlockProps();

    return (
        <div {...blockProps} id={`block-${clientId}`}>
        <InspectorControls>
                <PanelBody title="POI Settings" initialOpen={true}>
                    <SelectControl
                        label="Select Post Type"
                        value={selectedPostType}
                        options={postTypes}
                        onChange={handlePostTypeChange}
                    />

                    {loading ? (
                        <p>Loading posts...</p>
                    ) : (
                        <ComboboxControl
                            label="Add Featured POIs"
                            ref={inputContainer}
                            options={[
                                ...availablePosts.map((post) => ({
                                    label: post.title?.rendered || 'Untitled',
                                    value: post.id,
                                })),
                            ]}
                            onChange={onSelectHighlightedPOIChange}
                        />
                    )}
                </PanelBody>

                {highlightedPOIs.length > 0 && (
                    <PanelBody title="Featured POIs Order">
                        <p className="description">Featured POIs will appear first, followed by recent
                            posts.</p>
                        <Sortable
                            className="sortable-posts"
                            items={highlightedPOIs}
                            axis="grid"
                            onSortEnd={onHighlightedPOIsSortEnd}
                        >
                            {highlightedPOIs.map((postId) => {
                                const post = getPost(postId);
                                if (!post) return null;
                                return (
                                    <div
                                        className="sortable-posts__item sortable-posts__item--highlighted"
                                        key={postId}
                                    >
                                        {post.title?.rendered || 'Untitled'}
                                        <Button
                                            icon={'no-alt'}
                                            onClick={() => handleRemoveHighlightedPOI(postId)}
                                        />
                                    </div>
                                );
                            })}
                        </Sortable>
                    </PanelBody>
                )}
            </InspectorControls>
            <div className="itm-home-poi">
                <h3 className="itm-home-poi__title">Points of Interest: {postTypes.find(pt => pt.value === selectedPostType)?.label}</h3>
                {renderPOIContent()}
            </div>
        </div>
    );
}
