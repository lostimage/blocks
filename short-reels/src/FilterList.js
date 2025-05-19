import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

// List Item Component
const FilterItem = ({ id, name, isSelected, emoji }) => {
    return (
        <li
            id={id}
            className={classnames('bn-px-4 bn-py-2 bn-cursor-pointer bn-rounded-full bn-transition-colors', {
                'bn-bg-primary bn-text-white': isSelected,
                'bn-bg-gray-100 hover:bn-bg-gray-200': !isSelected
            })}
        >
            {emoji} {name}
        </li>
    );
};

const FilterList = ({ taxonomies, selectedTaxonomy }) => {
    return (
        <div className="short-reels-filters" data-selected-taxonomy={selectedTaxonomy}>
            <ul className="bn-flex bn-flex-wrap bn-gap-2 bn-list-none bn-p-0 bn-m-0">
                <FilterItem
                    key="all"
                    id=""
                    name={__('All', 'short-reels')}
                    emoji="🌏"
                    isSelected={true}
                />
                {taxonomies.length > 0 ? (
                    taxonomies.map((taxonomy) => (
                        <FilterItem
                            key={taxonomy.id}
                            id={taxonomy.id}
                            name={taxonomy.name}
                            emoji={taxonomy.meta?._emoji || ''}
                            isSelected={false}
                        />
                    ))
                ) : (
                    <li>{__('No filters selected', 'short-reels')}</li>
                )}
            </ul>
        </div>
    );
};

export default FilterList;
