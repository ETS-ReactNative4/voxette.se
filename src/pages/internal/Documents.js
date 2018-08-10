import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import FirebaseApp from '../../FirebaseApp';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import SearchIcon from '@material-ui/icons/Search';
import FilterListIcon from '@material-ui/icons/FilterList';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { link } from 'fs';

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
        overflowX: 'auto',
    },
    table: {
        minWidth: 700,
    },
    button: {
        margin: theme.spacing.unit,
    }, 
    input: {
        display: 'none',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 400,
    },
    download: {
        cursor: 'pointer'
    }
});

const types = [
    {
        value: 'application/pdf',
        label: 'PDF',
    },
    {
        value: 'audio',
        label: 'Ljudfiler',
    },
    {
        value: 'image',
        label: 'Bilder',
    }
];

function humanFileSize(size) {
    var i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
};


class Documents extends Component {
    
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            filterName: '',
            filterType: ''
        };
    }

    search(e) {
        const { filterName, filterType } = this.state;

        e.preventDefault();

        FirebaseApp.voxette.fetchFiles(filterName, filterType, (files) => {
            if (files) {
                this.setState({
                    files: files
                });
            }
        });

        return false;
    }

    handleFiles(event) {
        const files = event.target.files;

        for (var i = 0; i < files.length; i++) {
            const file = files[i];
            const invalidChars = /[.#$]/gi; // TODO also remove [ and ]
            const marker = file.name.replace(invalidChars, '_');
            const fullPath = new Date().getTime() + '_' + marker;

            FirebaseApp.voxette.uploadFile(fullPath, file, () => { // TODO update state after last file
                FirebaseApp.voxette.fetchAllFiles((files) => {
                    if (files) {
                        this.setState({
                            files: files
                        });
                    }
                });
            });
        }            
    }

    render() {
        const { classes } = this.props;
        const { files, filterName, filterType } = this.state;

        return (
            <div>
                <h2>Filer</h2>
                <p>Här kan du hitta noter och stämfiler. Sökning på namn sker från början och är "case sensitive" dvs. 'A' hittar Advent.pdf.</p>

                <Paper className={classes.root}>

                <input
                    accept="*/*"
                    className={classes.input}
                    id="upload-input"
                    multiple
                    type="file"
                    onChange={(event) => this.handleFiles(event)} 
                />
                <label htmlFor="upload-input">
                    <Button variant="fab" component="span" color="primary" aria-label="add" className={classes.button}>
                        <AddIcon />
                    </Button>
                </label>    

                <div>                     
                    <form onSubmit={(e) => this.search(e)}>
                    <TextField
                        id="name"
                        label="Namn"
                        className={classes.textField}
                        value={filterName}
                        onChange={(event) => this.handleChange(event, 'filterName')}
                        margin="normal"
                    />
                    <TextField
                        id="type"
                        select
                        label="Typ"
                        className={classes.textField}
                        value={filterType}
                        onChange={(event) => this.handleChange(event, 'filterType')}
                        SelectProps={{
                            MenuProps: {
                                className: classes.menu,
                            },
                        }}
                        margin="normal"
                    >
                        {types.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>                    
                    <Button type="submit" variant="contained">
                        <SearchIcon />
                    </Button>
                    </form>

                </div>

                    <Table className={classes.table}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Namn</TableCell>
                                <TableCell>Storlek</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {files.map(file => {
                                return (
                                    <TableRow hover key={file.fullPath}>
                                        <TableCell component="th" scope="row">
                                            {file.name}
                                        </TableCell>
                                        <TableCell>{humanFileSize(file.size)}</TableCell>
                                        <TableCell>
                                            <CloudDownloadIcon className={classes.download} onClick={() => this.handleClick(file.fullPath)}/>                                            
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Paper>                   
            </div>
        );
    }

    handleChange(event, name) {
        this.setState({
            [name]: event.target.value
        });
    }   

    handleClick = fullPath => {
        FirebaseApp.voxette.getDownloadUrl(fullPath, (url) => {
            window.open(url); // just open in new tab for now. Might be better to download due to bandwidth

            /*var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';
            xhr.onload = function(event) {
                var blob = xhr.response;

            };
            xhr.open('GET', url);
            xhr.send();*/
        });
    }
}

Documents.propTypes = {
    classes: PropTypes.object.isRequired,
};
  
export default withStyles(styles)(Documents);