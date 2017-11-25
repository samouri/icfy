import React from 'react';

import { getChartData, getChunkList } from './api';
import Masterbar from './Masterbar';
import Chart from './Chart';
import PushDetails from './PushDetails';

const sizes = ['stat_size', 'parsed_size', 'gzip_size'];

const Select = ({ value, onChange, options }) => {
	if (!options) {
		return (
			<select className="select" disabled>
				Loading
			</select>
		);
	}

	return (
		<select className="select" value={value} onChange={onChange}>
			{options.map(opt => (
				<option key={opt} value={opt}>
					{opt}
				</option>
			))}
		</select>
	);
};

class CheckList extends React.Component {
	static defaultProps = {
		value: [],
	};

	handleChange = event => {
		const { value, onChange } = this.props;
		const { name, checked } = event.target;
		if (checked) {
			onChange([...value, name]);
		} else {
			onChange(value.filter(v => v !== name));
		}
	};

	render() {
		const { value, options } = this.props;

		if (!options) {
			return null;
		}

		return (
			<div className="checklist">
				{options.map(opt => (
					<div key={opt} className="checklist__item">
						<input
							type="checkbox"
							id={opt}
							name={opt}
							checked={value.includes(opt)}
							onChange={this.handleChange}
						/>
						<label htmlFor={opt}>{opt}</label>
					</div>
				))}
			</div>
		);
	}
}

const Label = ({ children }) => <label className="label">{children}</label>;

class ChartView extends React.Component {
	state = {
		chunks: null,
		selectedChunks: ['build'],
		selectedSize: 'gzip_size',
		data: null,
		chartData: null,
		currentPushSha: null,
		currentPrevPushSha: null,
	};

	componentDidMount() {
		this.loadChunks();
		this.loadChart();
	}

	changeChunks = chunks => this.setChunks(chunks);
	changeSize = event => this.setSize(event.target.value);

	showPush = pushIndex => {
		const pushToLoad = this.state.data[0].data[pushIndex];
		const prevPush = pushIndex > 0 ? this.state.data[0].data[pushIndex - 1] : null;

		this.setState({
			currentPushSha: pushToLoad.sha,
			currentPrevPushSha: prevPush ? prevPush.sha : null,
		});
	};

	loadChunks() {
		getChunkList().then(response => {
			const { chunks } = response.data;
			this.setState({ chunks });
		});
	}

	loadChart() {
		Promise.all(
			this.state.selectedChunks.map(chunk =>
				getChartData(chunk).then(response => ({
					chunk,
					data: response.data.data,
				}))
			)
		).then(data => this.setData(data));
	}

	setChunks(selectedChunks) {
		if (selectedChunks.length === 0) {
			selectedChunks = ['build'];
		}
		this.setState({ selectedChunks }, () => this.loadChart());
	}

	setSize(selectedSize) {
		const { data } = this.state;
		this.setState({
			selectedSize,
			chartData: data.map(chunkData => [
				chunkData.chunk,
				...chunkData.data.map(d => d[selectedSize]),
			]),
		});
	}

	setData(data) {
		const { selectedSize } = this.state;
		this.setState({
			data,
			chartData: data.map(chunkData => [
				chunkData.chunk,
				...chunkData.data.map(d => d[selectedSize]),
			]),
		});
	}

	render() {
		return (
			<div className="layout">
				<Masterbar />
				<div className="sidebar">
					<Label>Select the chunks to display:</Label>
					<CheckList
						value={this.state.selectedChunks}
						onChange={this.changeChunks}
						options={this.state.chunks}
					/>
				</div>
				<div className="content has-sidebar">
					<Label>Select the size type you're interested in:</Label>
					<Select value={this.state.selectedSize} onChange={this.changeSize} options={sizes} />
					{this.state.chartData && (
						<Chart chartData={this.state.chartData} onMouseOver={this.showPush} />
					)}
					<PushDetails
						sha={this.state.currentPushSha}
						prevSha={this.state.currentPrevPushSha}
						size={this.state.selectedSize}
						debounceDelay={500}
					/>
				</div>
			</div>
		);
	}
}

export default ChartView;
