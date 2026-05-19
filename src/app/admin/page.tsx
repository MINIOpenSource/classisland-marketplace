'use client';

import { useState, useEffect } from 'react';
import { makeStyles, tokens, Text, Button, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Input, Spinner, Dialog, DialogSurface, DialogTitle, DialogContent, DialogActions, DialogBody } from '@fluentui/react-components';
import { SearchRegular, DeleteRegular, EyeRegular } from '@fluentui/react-icons';
import { adminFetchReviews, adminDeleteReview, adminFetchVotes, adminDeleteVote, Review, Vote } from '@/services/interactiveAPI';

const useStyles = makeStyles({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    toolbar: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '16px',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow2,
    },
    tableContainer: {
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow2,
        padding: '16px',
        overflowX: 'auto',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        alignItems: 'center',
        marginTop: '16px',
    }
});

export default function AdminPage() {
    const styles = useStyles();
    const token = ''; // Handled by Cloudflare Access proxy natively

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterPlugin, setFilterPlugin] = useState('');
    const [filterIp, setFilterIp] = useState('');

    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loadingVotes, setLoadingVotes] = useState(false);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await adminFetchReviews(token, page, 20, filterPlugin || undefined, filterIp || undefined);
            setReviews(res.data);
            setTotalPages(res.pagination.totalPages);
        } catch (e) {
            console.error(e);
            alert('Failed to fetch data. Check console or token.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (true) {
            fetchData();
        }
    }, [page]);

    const handleDelete = async (uuid: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await adminDeleteReview(uuid, token);
            fetchData();
        } catch (e) {
            alert('Failed to delete review');
        }
    };

    const handleViewVotes = async (review: Review) => {
        setSelectedReview(review);
        setLoadingVotes(true);
        try {
            const res = await adminFetchVotes(review.uuid, token, 1, 100);
            setVotes(res.data);
        } catch (e) {
            alert('Failed to fetch votes');
        } finally {
            setLoadingVotes(false);
        }
    };

    const handleDeleteVote = async (reviewUuid: string, ip: string) => {
        if (!confirm('Delete this vote?')) return;
        try {
            await adminDeleteVote(reviewUuid, ip, token);
            handleViewVotes(selectedReview!);
        } catch (e) {
            alert('Failed to delete vote');
        }
    };



    return (
        <div className={styles.container}>
            <Text size={800} weight="bold">Marketplace Admin Dashboard</Text>

            <div className={styles.toolbar}>
                <Input
                    placeholder="Filter by Plugin ID"
                    value={filterPlugin}
                    onChange={(e, d) => setFilterPlugin(d.value)}
                    contentBefore={<SearchRegular />}
                />
                <Input
                    placeholder="Filter by IP Address"
                    value={filterIp}
                    onChange={(e, d) => setFilterIp(d.value)}
                    contentBefore={<SearchRegular />}
                />
                <Button appearance="primary" onClick={() => { setPage(1); fetchData(); }}>Search</Button>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center' }}><Spinner /></div>
                ) : (
                    <>
                        <Table aria-label="Reviews table">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Time</TableHeaderCell>
                                    <TableHeaderCell>Plugin ID</TableHeaderCell>
                                    <TableHeaderCell>Score</TableHeaderCell>
                                    <TableHeaderCell>IP</TableHeaderCell>
                                    <TableHeaderCell>Content</TableHeaderCell>
                                    <TableHeaderCell>Actions</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.map((item) => (
                                    <TableRow key={item.uuid}>
                                        <TableCell>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</TableCell>
                                        <TableCell>{item.plugin_id}</TableCell>
                                        <TableCell>{item.score}</TableCell>
                                        <TableCell>{item.ip}</TableCell>
                                        <TableCell style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content}</TableCell>
                                        <TableCell>
                                            <Button icon={<EyeRegular />} appearance="subtle" onClick={() => handleViewVotes(item)} title="View Votes" />
                                            <Button icon={<DeleteRegular />} appearance="subtle" onClick={() => handleDelete(item.uuid)} style={{ color: tokens.colorPaletteRedForeground1 }} title="Delete" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className={styles.pagination}>
                            <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <Text>Page {page} of {totalPages || 1}</Text>
                            <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </>
                )}
            </div>

            <Dialog open={!!selectedReview} onOpenChange={(e, d) => { if(!d.open) setSelectedReview(null); }}>
                <DialogSurface style={{ minWidth: '600px' }}>
                    <DialogBody>
                        <DialogTitle>Votes for Review</DialogTitle>
                        <DialogContent>
                            <div style={{ margin: '16px 0', padding: '16px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium }}>
                                <Text block>{selectedReview?.content}</Text>
                            </div>

                            {loadingVotes ? <Spinner /> : (
                                <Table size="extra-small">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHeaderCell>Time</TableHeaderCell>
                                            <TableHeaderCell>IP</TableHeaderCell>
                                            <TableHeaderCell>Vote</TableHeaderCell>
                                            <TableHeaderCell>Actions</TableHeaderCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {votes.map(v => (
                                            <TableRow key={`${v.review_uuid}-${v.ip}`}>
                                                <TableCell>{new Date(v.created_at).toLocaleString()}</TableCell>
                                                <TableCell>{v.ip}</TableCell>
                                                <TableCell>{v.vote_type}</TableCell>
                                                <TableCell>
                                                    <Button icon={<DeleteRegular />} appearance="subtle" onClick={() => handleDeleteVote(v.review_uuid, v.ip)} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            {votes.length === 0 && !loadingVotes && <Text>No votes found.</Text>}
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => setSelectedReview(null)}>Close</Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    );
}
