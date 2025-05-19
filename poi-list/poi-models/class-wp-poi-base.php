<?php
/**
 * Base POI (Point of Interest) class
 * Used as a parent class for Campsite, F-Road, and Hot Spring models
 *
 * @package campeasy
 *
 * @method array    get_title_icons()
 * @method string   get_overview()
 */

declare( strict_types=1 );

namespace Itm\model\entity\location\poi;

use DI\Attribute\Inject;
use Itm\Helper\Get_Comments;
use Itm\Helper\Icon_Helper;
use Itm\Kernel\App;
use Itm\Kernel\Exceptions\Kernel_Exception;
use Itm\Model\Repository\Collection\Commentable_Entity;
use Itm\Model\Repository\Collection\Comments_Collection;
use Psr\Log\LoggerInterface;

/**
 * Class Wp_Poi_Base
 * Base class for all POI types
 */
abstract class Wp_Poi_Base implements Commentable_Entity {
	use Get_Comments;

	/**
	 * @var array<string>
	 */
	protected array $string_fields = [
		'open_date', 'close_date', 'opening_hours', 'overview',
	];

	/**
	 * @var array<string>
	 */
	protected array $bool_fields = [];

	/**
	 * @var array<string>
	 */
	protected array $facilities = [];

	/**
	 * @var array<string|array<string,string>>
	 */
	protected array $values = [];

	/**
	 * @var array<string>
	 */
	protected array $gallery_sorted;

	/**
	 * @var array<string|array<string,string>>
	 */
	protected array $default_values;

	#[Inject]
	/** @phpstan-ignore-next-line  argument.type */
	protected Icon_Helper $icon_helper;

	protected ?Comments_Collection $comments = null;

	#[Inject]
	/** @phpstan-ignore-next-line  argument.type */
	protected LoggerInterface $log;

	/**
	 * Constructor.
	 */
	protected function __construct(protected readonly int $post_id) {
		$this->default_values = [
			'open_date' => '',
			'close_date' => '',
			'opening_hours' => '',
			'title_icons' => [],
			'overview' => '',
		];

		App::get()->get_container()->injectOn($this);
	}

	/**
	 * Get WordPress post ID.
	 */
	public function get_wp_post_id(): int {
		return $this->post_id;
	}

	/**
	 * Get WordPress post object.
	 */
	public function get_wp_post(): ?\WP_Post {
		return get_post($this->post_id);
	}

	/**
	 * Check if POI is open during the dates booked for a camper.
	 * Always returns a status instead of null.
	 *
	 * @param \Itm\Request\Camper_Request $camper_request The camper booking request
	 * @return bool Returns true if open, false if closed
	 */
	public function is_open_for_camper_dates(\Itm\Request\Camper_Request $camper_request): bool {
		// Get campsite operating dates
		$open_date = $this->get_open_date();
		$close_date = $this->get_close_date();

		// Get camper booking dates
		try {
			$camper_start_date = $camper_request->get_start_date();
			$camper_end_date = $camper_request->get_end_date();
		} catch (\Exception $e) {
			// If there's an issue with camper dates, assume closed for safety
			return false;
		}

		// Check for "All year" text in either field - campsite is always open
		if (strcasecmp(trim($open_date), "All year") === 0 ||
		    strcasecmp(trim($close_date), "All year") === 0) {
			return true;
		}

		// If campsite dates aren't set, assume closed for safety
		if (empty($open_date) || empty($close_date)) {
			return false;
		}

		// Parse campsite operating dates
		$site_open_timestamp = strtotime($open_date);
		$site_close_timestamp = strtotime($close_date);

		if ($site_open_timestamp === false || $site_close_timestamp === false) {
			// Invalid date format, assume closed for safety
			return false;
		}

		// Check if camper booking dates fall entirely within campsite operating season
		$camper_start_timestamp = $camper_start_date->getTimestamp();
		$camper_end_timestamp = $camper_end_date->getTimestamp();

		// The campsite must be open for the entire duration of the camper booking
		return ($camper_start_timestamp >= $site_open_timestamp &&
		        $camper_end_timestamp <= $site_close_timestamp);
	}

	/**
	 * Check if the POI is open on the current date.
	 * This is a simpler version that just checks against today's date.
	 *
	 * @return bool|null Returns true if open, false if closed, null if dates not set
	 */
	public function is_open(): ?bool {
		$open_date = $this->get_open_date();
		$close_date = $this->get_close_date();

		// Check for "All year" text in either field
		if (strcasecmp(trim($open_date), "All year") === 0 ||
		    strcasecmp(trim($close_date), "All year") === 0) {
			return true;
		}

		// If dates aren't set, we can't determine
		if (empty($open_date) || empty($close_date)) {
			return null;
		}

		// Get current date
		$current_date = current_time('Y-m-d');
		$current_timestamp = strtotime($current_date);

		// Parse campsite operating dates
		$open_timestamp = strtotime($open_date);
		$close_timestamp = strtotime($close_date);

		if ($open_timestamp === false || $close_timestamp === false) {
			return null; // Invalid date format, can't determine
		}

		// Check if today falls within operating range
		return ($current_timestamp >= $open_timestamp && $current_timestamp <= $close_timestamp);
	}

	/**
	 * Get operating dates formatted for display
	 * Checks for "All year" text in date fields or specific operating dates
	 *
	 * @return string
	 */
	public function get_operating_dates(): string {
		$open_date = $this->get_open_date();
		$close_date = $this->get_close_date();

		// Check if either date field contains "All year" text
		if (strcasecmp(trim($open_date), "All year") === 0 ||
		    strcasecmp(trim($close_date), "All year") === 0) {
			return __('Open all year', 'campeasy');
		}

		// If both dates are valid and represent a full year (Jan 1 - Dec 31)
		if (!empty($open_date) && !empty($close_date)) {
			// Try to parse dates - only proceed if valid
			$open_timestamp = strtotime($open_date);
			$close_timestamp = strtotime($close_date);

			// If dates are valid, check if they represent a full year
			if ($open_timestamp !== false && $close_timestamp !== false) {
				$open_month_day = date('m-d', $open_timestamp);
				$close_month_day = date('m-d', $close_timestamp);

				if ($open_month_day === '01-01' && $close_month_day === '12-31') {
					return __('Open all year', 'campeasy');
				}

				// Regular date range - show formatted dates
				return sprintf(
					__('Operating dates %s - %s', 'campeasy'),
					esc_html($open_date),
					esc_html($close_date)
				);
			} else {
				// Dates couldn't be parsed as timestamps, just display as is
				return sprintf(
					__('Operating dates %s - %s', 'campeasy'),
					esc_html($open_date),
					esc_html($close_date)
				);
			}
		}

		// If only open_date has a value and it's not "All year" (already checked above)
		if (!empty($open_date)) {
			return sprintf(__('Open from %s', 'campeasy'), esc_html($open_date));
		}

		// If only close_date has a value and it's not "All year" (already checked above)
		if (!empty($close_date)) {
			return sprintf(__('Open until %s', 'campeasy'), esc_html($close_date));
		}

		// If no dates are available
		return '';
	}

	/**
	 * Get gallery images.
	 *
	 * @return array<string>
	 */
	public function get_gallery(): array {
		if ((!isset($this->values['gallery']) || !is_array($this->values['gallery']))) {
			return [];
		}

		return $this->values['gallery'];
	}

	/**
	 * Get sorted gallery images.
	 *
	 * @return array<string>
	 */
	public function get_gallery_sorted(): array {
		if (!isset($this->gallery_sorted)) {
			$this->gallery_sorted = [];
			$gallery = [];
			foreach ($this->get_gallery() as $v) {
				$line = [];
				$line['id'] = $v;
				$line['priority'] = $this->get_gallery_item_priority((int)$v);
				$gallery[] = $line;
			}
			usort($gallery, fn($a, $b) => $b['priority'] <=> $a['priority']);
			foreach ($gallery as $v) {
				$this->gallery_sorted[] = $v['id'];
			}
		}

		return $this->gallery_sorted;
	}

	/**
	 * Get gallery item priority.
	 */
	private function get_gallery_item_priority(int $id): int {
		$terms = get_the_terms($id, 'priority_order');
		if (is_array($terms) && isset($terms[0])) {
			return (int)$terms[0]->name;
		}

		return 0;
	}

	/**
	 * Get all facilities with their status for this POI.
	 *
	 * @return array<string,bool>
	 */
	public function get_facilities(): array {
		$facilities_status = [];

		foreach ($this->facilities as $facility) {
			$value = $this->values[$facility] ?? false;
			$facilities_status[$facility] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
		}

		return $facilities_status;
	}

	/**
	 * Get array of available facilities for this POI.
	 * Returns names of all enabled facilities in an array.
	 *
	 * @return array<string> List of available facility names
	 */
	public function get_available_facilities(): array {
		$available_facilities = [];
		$facilities = $this->get_facilities();

		foreach ($facilities as $key => $value) {
			if ($value) {
				$available_facilities[] = $key;
			}
		}

		return $available_facilities;
	}

	/**
	 * Check if a specific facility is available.
	 *
	 * @param string $facility_name The name of the facility to check
	 * @return bool True if the facility is available, false otherwise
	 */
	public function has_facility(string $facility_name): bool {
		$facilities = $this->get_facilities();
		return isset($facilities[$facility_name]) && $facilities[$facility_name];
	}

	/**
	 * Magic method to handle getters.
	 *
	 * @param string $name
	 * @param array<int, int|string|float|null> $arguments
	 *
	 * @return string|array<string,array<string,string>>|array<string, string>|bool
	 * @throws Kernel_Exception
	 */
	public function __call(string $name, array $arguments): mixed {
		if (strpos($name, 'get_') === 0) {
			$field = str_replace('get_', '', $name);
			return $this->call_get($field);
		}
		throw new Kernel_Exception('Class ' . get_class($this) . ' method ' . $name . ' not exists');
	}

	/**
	 * Handle get calls.
	 *
	 * @param string $name
	 *
	 * @return string|array<string,array<string,string>>|array<string, string>|bool
	 * @throws Kernel_Exception
	 */
	protected function call_get(string $name): string|array|bool {
		if (array_key_exists($name, $this->values)) {
			if (in_array($name, $this->string_fields, true)) {
				return (string)$this->values[$name];
			} elseif (in_array($name, $this->bool_fields, true)) {
				return filter_var($this->values[$name], FILTER_VALIDATE_BOOLEAN);
			} elseif ($name === 'title_icons') {
				return $this->get_icon_field($name);
			}

			return $this->values[$name];
		}

		if (array_key_exists($name, $this->default_values)) {
			return $this->default_values[$name];
		}

		throw new Kernel_Exception('Class ' . get_class($this) . ' property ' . $name . ' not exists');
	}

	/**
	 * Process icon fields.
	 *
	 * @param string $name
	 *
	 * @return array<string,array<string,string>>
	 */
	protected function get_icon_field(string $name): array {
		if (!isset($this->values[$name]) || !is_array($this->values[$name])) {
			return [];
		}

		return $this->icon_helper->get_icons_by_id_list($this->values[$name]);
	}

	/**
	 * Get ACF field directly.
	 */
	public function get_direct_acf_field(string $key): string|int|bool|null|array {
		if (!array_key_exists($key, $this->values)) {
			return '';
		}

		return $this->values[$key];
	}

	/**
	 * Load values from ACF fields
	 */
	protected function load_acf_fields(): void {
		$data = get_fields($this->post_id);

		if (is_array($data)) {
			foreach ($data as $k => $v) {
				$this->values[$k] = $v;
			}
		}
	}
}
